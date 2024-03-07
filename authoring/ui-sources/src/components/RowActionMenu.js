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

import React from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined';
import SaveIcon from '@mui/icons-material/Save';
import ClearIcon from '@mui/icons-material/Clear';
import EditIcon from '@mui/icons-material/Edit';

export default function RowActionMenu({
  selectedCell,
  anchorEl,
  handleClose,
  handleUnlockAction,
  handleEditAction,
  handleSaveAction,
  handleClearAction
}) {
  const { row } = selectedCell;
  return (
    <Menu
        id="row-action-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'row-action-button',
        }}
        PaperProps={{
          style: {
            minWidth: 120,
          },
       }}
      >
      {row?.lockOwner && (
        <MenuItem onClick={handleUnlockAction}>
          <ListItemIcon>
            <LockOpenOutlinedIcon />
          </ListItemIcon>
          <ListItemText primary="Unlock" />
        </MenuItem>
      )}
      <MenuItem onClick={handleEditAction}>
        <ListItemIcon>
          <EditIcon />
        </ListItemIcon>
        <ListItemText primary="Open Edit Form" />
      </MenuItem>
      <MenuItem onClick={handleSaveAction}>
        <ListItemIcon>
          <SaveIcon />
        </ListItemIcon>
        <ListItemText primary="Save Item" />
      </MenuItem>
      <MenuItem onClick={handleClearAction}>
        <ListItemIcon>
          <ClearIcon />
        </ListItemIcon>
        <ListItemText primary="Clear Change" />
      </MenuItem>
    </Menu>
  );
}