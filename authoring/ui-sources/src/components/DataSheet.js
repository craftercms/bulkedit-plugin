/*
 * Copyright (C) 2007-2024 Crafter Software Corporation. All Rights Reserved.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3 as published by
 * the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
import * as React from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { makeStyles } from '@mui/styles';
import {
  IconButton
} from '@mui/material';

import MoreVertIcon from '@mui/icons-material/MoreVert';

import PathCell from './PathCell';
import DefaultCell from './DefaultCell';
import CellActionMenu from './CellActionMenu';
import SaveProgress from './SaveProgress';
import RowActionMenu from './RowActionMenu';

import {
  contentTypeSub,
  findReplaceSub,
  keywordSub,
  filterEditDateSub
} from '../services/subscribe';
import StudioAPI from '../api/studio';
import ActionHelper from '../helpers/action';
import ContentTypeHelper from '../helpers/ContentTypeHelper';
import DialogHelper from '../helpers/dialog';

const DEFAULT_PAGE_SIZE = 9;
const ROWS_PER_PAGE_OPTIONS = [9, 15, 21];
const DEFAULT_COLUMN_WIDTH = 220;

const useStyles = makeStyles({
  root: {
    height: '100%',
    width: '100%',
    '& .edited': {
      backgroundColor: '#a5d6a7',
      color: '#1b5e20',
    },
    '& .found': {
      backgroundColor: '#b9d5ff91',
      color: '#1a3e72',
    },
  },
});

/**
 * @param {*} config - form-definition.xml
 * @returns Array of field object
 */
const getFieldsFromConfig = (config) => {
  const xmlDoc = (new DOMParser()).parseFromString(config, 'text/xml');
  const xpath = '/form/sections/section/fields/field';
  const result = xmlDoc.evaluate(xpath, xmlDoc, null, XPathResult.ANY_TYPE, null);

  const fields = [];
  let node = result.iterateNext();
  while (node) {
    const fieldType = node.getElementsByTagName('type')[0].textContent;
    if (!ContentTypeHelper.isUnsupportedFieldType(fieldType)) {
      const fieldId = node.getElementsByTagName('id')[0].textContent;
      const title = node.getElementsByTagName('title')[0].textContent;
      fields.push({ fieldId, fieldType, title });
    }

    node = result.iterateNext();
  }

  return fields;
};

const getColumnsFromFields = (fields) => {
  // default to have `id` and `path`
  const columns = [{
    field: 'action',
    headerName: 'Action',
    description: 'Action',
    sortable: false,
    width: 72,
    editable: false,
    align: 'center',
    renderCell: ((params) => (
      <IconButton>
        <MoreVertIcon />
      </IconButton>
    ))
  }, {
    field: 'id',
    headerName: 'ID',
    description: 'ID',
    sortable: false,
    width: 0,
    editable: false,
  }, {
    field: 'path',
    headerName: 'Path',
    description: 'Path',
    sortable: false,
    width: DEFAULT_COLUMN_WIDTH,
    editable: false,
    renderCell: PathCell
  }];

  for (const field of fields) {
    const { fieldId, fieldType, title } = field;
    const column = {
      field: fieldId,
      headerName: title,
      description: title,
      sortable: false,
      width: DEFAULT_COLUMN_WIDTH,
      editable: true,
      fieldType,
    };

    if (fieldType === ContentTypeHelper.FIELD_TYPE_RTE ||
                      ContentTypeHelper.isMediaType(fieldType) ||
                      !ContentTypeHelper.isRenderableFieldType(fieldType)) {
      column.renderCell = DefaultCell;
    }

    columns.push(column);
  }

  return columns;
};

const getColumnProperties = (fieldName, columns) => {
  return columns.find((cl) => cl.field === fieldName);
};

const rowFromApiContent = (index, path, content, fields, meta) => {
  const xml = (new DOMParser()).parseFromString(content, 'text/xml');
  const row = { id: index, path };
  if (meta?.lockOwner) {
    row.lockOwner = meta.lockOwner;
  }
  for (const object of fields) {
    const field = xml.getElementsByTagName(object.fieldId)[0];
    row[object.fieldId] = field ? field.textContent : '';
    if (object.fieldType === ContentTypeHelper.FIELD_TYPE_NODE_SELECTOR) {
      row[`${object.fieldId}_raw`] = field;
    }
  };

  return row;
};

const isCellEdited = (params, rows) => {
  if (!params || rows.length === 0) return false;

  const cellId = params.id;
  const cellField = params.field;
  const cellValue = params.value;
  return rows[cellId] && cellValue !== rows[cellId][cellField];
};

const isCellContainText = (text, params) => {
  if (!text || !params) return false;

  if (!ContentTypeHelper.isRenderableFieldType(params.colDef.fieldType)) {
    return false;
  }

  const cellValue = params.value;
  return cellValue?.indexOf(text) >= 0;
};

const writeTableContent = async (path, editedObj, contentType) => {
  const content = await StudioAPI.getContent(path);
  if (!content) {
    return;
  }

  const xml = (new DOMParser()).parseFromString(content, 'text/xml');

  const keys = Object.keys(editedObj).filter(key => !key.endsWith('_raw'));
  for (const key of keys) {
    const value = editedObj[key];
    const node = xml.getElementsByTagName(key)[0];
    if (!node) {
      continue;
    }

    if (editedObj[`${key}_raw`]) {
      node.parentNode.replaceChild(editedObj[`${key}_raw`], node);
    } else {
      node.textContent = value;
    }
  }

  const newContent = new XMLSerializer().serializeToString(xml);
  const res = await StudioAPI.writeContent(path, newContent, contentType);
  if (res) {
    return newContent;
  }

  return null;
};

const DataSheet = React.forwardRef((props, ref) => {
  const classes = useStyles();

  const [columns, setColumns] = React.useState([]);
  const [rows, setRows] = React.useState([]);
  const [sessionRows, setSessionRows] = React.useState([]);
  const [editedRows, setEditedRows] = React.useState({});
  const [editRowsModel, setEditRowsModel] = React.useState({});
  const [refresh, setRefresh] = React.useState(0);
  const [findText, setFindText] = React.useState('');
  const [contentType, setContentType] = React.useState('');
  const [keyword, setKeyword] = React.useState('');
  const [filterEditDate, setFilterEditDate] = React.useState(null);
  const [menuActionAnchor, setMenuActionAnchor] = React.useState(null);
  const [selectedRow, setSelectedRow] = React.useState({});
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [bulkCompletedCount, setBulkCompletedCount] = React.useState(0);
  const [bulkTotalCount, setBulkTotalCount] = React.useState(0);
  const [rowActionMenuAnchor, setRowActionMenuAnchor] = React.useState(null);
  const [page, setPage] = React.useState(0);
  const [totalItems, setTotalItems] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE);

  React.useImperativeHandle(ref, () => ({
    cancelAllChanges: () => {
      setEditedRows({});
      setSessionRows([...rows]);
      setRefresh(1 - refresh);
    },
    saveAllChanges: async () => {
      const keys = Object.keys(editedRows);

      const totalCount = keys.length;
      let completedCount = 0;
      const failedRows = [];

      if (totalCount === 0) {
        return;
      }

      setIsProcessing(true);
      setBulkTotalCount(totalCount);

      const fields = columns.map((cl) => ({
                                  fieldId: cl.field,
                                  fieldType: cl.fieldType
                              }))
                              .filter((field) => field.fieldId !== 'id' && field.fieldId !== 'path' && field.fieldId !== 'action');

      for (let i = 0; i < totalCount; i++) {
        const path = keys[i];
        const newContent = await writeTableContent(path, editedRows[path], contentType);
        if (!newContent) {
          console.log(`Error while saving path ${path}`);
          failedRows.push(editedRows[path]);
        } else {
          completedCount += 1;
          setBulkCompletedCount(completedCount);
          const row = sessionRows.find((r) => r.path === path);
          if (row) {
            const rowIndex = row.id;
            sessionRows[rowIndex] = rowFromApiContent(rowIndex, path, newContent, fields);
          }
        }
      };

      if (completedCount === totalCount) {
        setTimeout(() => {
          setIsProcessing(false);
        }, 4000);
        setSessionRows([...sessionRows]);
        setRows([...sessionRows]);
        setEditedRows({});
        setRefresh(1 - refresh);
      } else {
        setEditedRows(failedRows);
      }
    },
  }));

  const replaceTextInAllRows = (text, replaceText, rows, columns) => {
    const newRows = [];
    for (const row of rows) {
      const newRow = replaceTextInRow(text, replaceText, row, columns);
      newRows.push(newRow);
    }

    return newRows;
  };

  const replaceTextInRow = (text, replaceText, row, columns) => {
    const newRow = {};
    const keys = Object.keys(row)
                        .filter(key => !key.endsWith('_raw'));

    for (const fieldName of keys) {
      const fieldValue = editedRows?.[row.path]?.[fieldName] ? editedRows?.[row.path]?.[fieldName] : row[fieldName];
      let newFieldValue = fieldValue;
      const props = getColumnProperties(fieldName, columns);
      if (props?.editable && (
        ContentTypeHelper.isRenderableFieldType(props?.fieldType) || props?.fieldType === ContentTypeHelper.FIELD_TYPE_NODE_SELECTOR
      )) {
        newFieldValue = fieldValue.replaceAll(text, replaceText);
      }
      newRow[fieldName] = newFieldValue;

      const model = { id: row.id, field: fieldName, value: newFieldValue };
      if (props.fieldType === ContentTypeHelper.FIELD_TYPE_NODE_SELECTOR) {
        const rawFieldName = `${fieldName}_raw`;
        const xmlDoc = row[rawFieldName];
        if (xmlDoc) {
          const serializer = new XMLSerializer();
          const xmlStr = serializer.serializeToString(xmlDoc);
          const updatedXmlStr = xmlStr.replaceAll(text, replaceText);
          const parser = new DOMParser();
          const updatedXmlDoc = parser.parseFromString(updatedXmlStr, 'text/xml');
          model.rawValue = updatedXmlDoc.documentElement;
          newRow[rawFieldName] = updatedXmlDoc;
        }
      }

      if (newFieldValue !== fieldValue) {
        saveEditState(model);
      }
    }

    return newRow;
  };

  React.useEffect(() => {
    const subscriber = findReplaceSub.subscribe((value) => {
      const {
        findText,
        replaceText,
        action
      } = value;
      if (action === ActionHelper.FIND) {
        setFindText(findText);
      }

      if (action === ActionHelper.REPLACE) {
        const newRows = replaceTextInAllRows(findText, replaceText, sessionRows, columns);
        setSessionRows(newRows);
      }
    });

    return (() => {
      subscriber.unsubscribe();
    });
  }, [sessionRows, columns]);

  React.useEffect(() => {
    const subscriberContentType = contentTypeSub.subscribe((nextContentType) => {
      setContentType(nextContentType);
    });

    const subscriberKeyword = keywordSub.subscribe((keyword) => {
      setKeyword(keyword);
    });

    const subscriberEditDate = filterEditDateSub.subscribe((filterDate) => {
      setFilterEditDate(filterDate);
    })

    return (() => {
      subscriberContentType.unsubscribe();
      subscriberKeyword.unsubscribe();
      subscriberEditDate.unsubscribe();
    });
  }, []);

  React.useEffect(() => {
    setRefresh(1 - refresh);
  }, [contentType]);

  React.useEffect(() => {
    (async () => {
      if (!contentType) {
        return;
      }

      setLoading(true);
      const config = await StudioAPI.getContentTypeDefinitionConfig(contentType);
      const fields = getFieldsFromConfig(config);
      setColumns(getColumnsFromFields(fields));

      const { items, total } = await StudioAPI.searchByContentType(contentType, keyword, filterEditDate, page * pageSize, pageSize);
      setTotalItems(total);
      const paths = items.map(item => item.path);

      const dtRows = [];
      const dtSessionRows = [];
      for (let i = 0; i < paths.length; i += 1) {
        const path = paths[i];

        const content = await StudioAPI.getContent(path);
        const meta = await StudioAPI.getSandboxItemByPath(path);
        const row = rowFromApiContent(i, path, content, fields, meta);
        const editedValue = {};
        if (editedRows[row.path]) {
          // row has some work in the current session
          const keys = Object.keys(editedRows[row.path]);
          for (let key of keys) {
            editedValue[key] = editedRows[row.path][key];
          }
        }
        dtRows.push({ ...row });
        dtSessionRows.push({
          ...row,
          ...editedValue
        });
      }

      setRows(dtRows);
      setSessionRows(dtSessionRows);
      setLoading(false);
    })();
  }, [contentType, keyword, filterEditDate, page]);

  const handleEditRowsModelChange = (model) => {
    setEditRowsModel(model);
  };

  /**
   * Callback called before updating a row with new values in the row and cell editing.
   * @param {*} newRow
   * @param {*} oldRow
   * @returns
   */
  const processRowUpdate = (newRow, oldRow) => {
    const currentEditedRows = editedRows;

    const key = oldRow.path;
    if (!currentEditedRows[key]) {
      currentEditedRows[key] = {};
    }

    const fields = Object.keys(oldRow);
    for (const field of fields) {
      if (oldRow[field] !== newRow[field]) {
        currentEditedRows[key][field] = newRow[field];
      }
    }

    setEditedRows(currentEditedRows);

    return newRow;
  };

  const saveEditState = (model) => {
    if (!isCellEdited(model, rows)) return;

    const key = rows[model.id].path;
    if (!editedRows[key]) {
      editedRows[key] = {};
    }
    editedRows[key][model.field] = model.value;
    if (model.rawValue) {
      editedRows[key][`${model.field}_raw`] = model.rawValue;
    }
    setEditedRows({...editedRows});
  };

  const handleOnCellClick = (model, event, detail) => {
    setSelectedRow(model);

    const field = model.field;
    if (field === 'action') {
      event.preventDefault();
      event.stopPropagation();
      setRowActionMenuAnchor(event.currentTarget);
      return;
    }

    const fieldType = model.colDef.fieldType;
    const fieldName = model.colDef.field;
    const openEditForm = fieldName !== 'path' && (ContentTypeHelper.isMediaType(fieldType) ||
                         ContentTypeHelper.isRteType(fieldType) ||
                         !ContentTypeHelper.isRenderableFieldType(fieldType));
    if (openEditForm) {
      event.preventDefault();
      event.stopPropagation();
      setMenuActionAnchor(event.currentTarget);
    }
  };

  const handleMenuActionViewClick = (event) => {
    setMenuActionAnchor(null);
    const isEdit = false;
    openEditDialog(isEdit);
  };

  const handleMenuActionEditClick = (event) => {
    setMenuActionAnchor(null);
    const isEdit = true;
    openEditDialog(isEdit);
  };

  /**
   * Open the Studio edit dialog to direct update
   * @param {*} isEdit true if in edit mode, false if in view mode
   */
  const openEditDialog = (isEdit) => {
    const { row, field } = selectedRow;
    const payload = {
      path: row.path,
      authoringBase: craftercms.getStore().getState().env.authoringBase,
      site: StudioAPI.siteId(),
      readonly: !isEdit,
      selectedFields: [field]
    };

    const onEditedSussessful = async (response) => {
      const fieldId = selectedRow.field;
      const path = selectedRow.row.path;

      const content = await StudioAPI.getContent(path);
      const xml = (new DOMParser()).parseFromString(content, 'text/xml');
      const field = xml.getElementsByTagName(fieldId)[0];
      if (field) {
        sessionRows[selectedRow.id][selectedRow.field] = field.textContent;
        rows[selectedRow.id][selectedRow.field] = field.textContent;

        if (selectedRow.colDef.fieldType === ContentTypeHelper.FIELD_TYPE_NODE_SELECTOR) {
          sessionRows[selectedRow.id][`${selectedRow.field}_raw`] = field;
          rows[selectedRow.id][`${selectedRow.field}_raw`] = field;
        }
      }

      setSessionRows([...sessionRows]);
      setRows([...rows]);
    };

    const onEditedFailed = (error) => {
      setSelectedRow({});
    };

    DialogHelper.showEditDialog(payload, onEditedSussessful, onEditedFailed);
  };

  const handleRowMenuActionUnlock = async () => {
    const { row } = selectedRow;
    if (!row?.path || !row?.lockOwner) return;

    const res = await StudioAPI.unlockContent(row.path);
    if (res) {
      sessionRows[row.id].lockOwner = null;
      setSessionRows([...sessionRows]);
    }

    setRowActionMenuAnchor(null);
  };

  const handleRowMenuActionEdit = async () => {
    setRowActionMenuAnchor(null);
    const { row } = selectedRow;
    const payload = {
      path: row.path,
      authoringBase: craftercms.getStore().getState().env.authoringBase,
      site: StudioAPI.siteId(),
      readonly: false,
    };

    const onEditedSussessful = (response) => {
      const model = selectedRow;
      model.path = response.updatedModel[model.field];
      model.value = response.updatedModel[model.field];
      const fieldIds = columns.map((cl) => cl.field).filter((field) => field !== 'id' && field !== 'path' && field !== 'action');
      for (const field of fieldIds) {
        sessionRows[model.id][field] = response.updatedModel[field];
        rows[model.id][field] = response.updatedModel[field];
      }
      setSessionRows([...sessionRows]);
      setRows([...rows]);
      setSelectedRow({});
    };

    const onEditedFailed = (error) => {
      setSelectedRow({});
    };

    DialogHelper.showEditDialog(payload, onEditedSussessful, onEditedFailed);
  };

  const handleRowMenuActionSave = async () => {
    const { row } = selectedRow;
    if (!row?.path) {
      setRowActionMenuAnchor(null);
      return;
    }

    const path = row.path;
    if (!editedRows[path]) {
      setRowActionMenuAnchor(null);
      return;
    }

    const newContent = await writeTableContent(path, editedRows[path], contentType);
    if (newContent) {
      const fields = columns.map((cl) => ({
                                  fieldId: cl.field,
                                  fieldType: cl.fieldType
                              }))
                              .filter((field) => field.fieldId !== 'id' && field.fieldId !== 'path' && field.fieldId !== 'action');
      sessionRows[row.id] = rowFromApiContent(row.id, path, newContent, fields);
      rows[row.id] = sessionRows[row.id]
      setSessionRows([...sessionRows]);
      setRows([...rows]);
    }

    setRowActionMenuAnchor(null);
  };

  const handleRowMenuActionClear = async () => {
    const { row } = selectedRow;
    if (!row?.path) {
      setRowActionMenuAnchor(null);
      return;
    }

    const path = row.path;
    const content = await StudioAPI.getContent(path);
    if (!content) {
      setRowActionMenuAnchor(null);
      return;
    }

    const meta = await StudioAPI.getSandboxItemByPath(path);
    if (!meta) {
      setRowActionMenuAnchor(null);
      return;
    }

    const fields = columns.map((cl) => ({
                            fieldId: cl.field,
                            fieldType: cl.fieldType
                          }))
                          .filter((field) => field.fieldId !== 'id' && field.fieldId !== 'path' && field.fieldId != 'action');
    const rowFromApi = rowFromApiContent(row.id, path, content, fields, meta);
    sessionRows[row.id] = rowFromApi;
    setSessionRows([...sessionRows]);

    delete editedRows[path];
    setEditedRows({...editedRows});
    setRowActionMenuAnchor(null);
  };

  return (
    <div className={classes.root}>
      <DataGrid
        key={refresh}
        rows={sessionRows}
        columns={columns}
        pagination
        pageSize={pageSize}
        rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
        rowCount={totalItems}
        paginationMode="server"
        onPageChange={(newPage) => setPage(newPage)}
        onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
        loading={loading}
        disableSelectionOnClick
        editRowsModel={editRowsModel}
        initialState={{
          columns: {
            columnVisibilityModel: {
              id: false
            }
          }
        }}
        onCellClick={handleOnCellClick}
        getCellClassName={(params) => {
          if (!params.isEditable) return '';

          if (isCellEdited(params, rows)) {
            return 'edited';
          }

          if (findText && isCellContainText(findText, params)) {
            return 'found';
          }

          return '';
        }}
        onEditRowsModelChange={handleEditRowsModelChange}
        processRowUpdate={processRowUpdate}
        onProcessRowUpdateError={(error) => { console.log(`Error while updating row: ${error}`); }}
      />
      <RowActionMenu
        anchorEl={rowActionMenuAnchor}
        handleClose={() => setRowActionMenuAnchor(null)}
        handleUnlockAction={handleRowMenuActionUnlock}
        handleEditAction={handleRowMenuActionEdit}
        handleSaveAction={handleRowMenuActionSave}
        handleClearAction={handleRowMenuActionClear}
        selectedCell={selectedRow}
      />
      <CellActionMenu
        anchorEl={menuActionAnchor}
        handleClose={() => setMenuActionAnchor(null)}
        handleViewAction={handleMenuActionViewClick}
        handleEditAction={handleMenuActionEditClick}
      >
      </CellActionMenu>
      {isProcessing && (
        <SaveProgress
          completed={bulkCompletedCount}
          total={bulkTotalCount}
        />
      )}
    </div>
  );
});

export default DataSheet;
