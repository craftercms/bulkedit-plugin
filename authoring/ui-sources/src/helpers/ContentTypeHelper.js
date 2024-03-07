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
const ContentTypeHelper = {
  FIELD_TYPE_INPUT: 'input',
  FIELD_TYPE_NUMERIC_INPUT: 'numeric-input',
  FIELD_TYPE_TEXTAREA: 'textarea',
  FIELD_TYPE_RTE: 'rte',
  FIELD_TYPE_VIDEO_PICKER: 'video-picker',
  FIELD_TYPE_IMAGE_PICKER: 'image-picker',
  FIELD_TYPE_AUTO_FILENAME: 'auto-filename',
  FIELD_TYPE_NODE_SELECTOR: 'node-selector',
  renderableFieldTypes() {
    return [
      ContentTypeHelper.FIELD_TYPE_INPUT,
      ContentTypeHelper.FIELD_TYPE_NUMERIC_INPUT,
      ContentTypeHelper.FIELD_TYPE_TEXTAREA,
      ContentTypeHelper.FIELD_TYPE_RTE,
      ContentTypeHelper.FIELD_TYPE_VIDEO_PICKER,
      ContentTypeHelper.FIELD_TYPE_IMAGE_PICKER,
    ];
  },
  unsupportedFieldTypes() {
    return [
      ContentTypeHelper.FIELD_TYPE_AUTO_FILENAME
    ];
  },
  isRenderableFieldType(fieldType) {
    return ContentTypeHelper.renderableFieldTypes().includes(fieldType);
  },
  isUnsupportedFieldType(fieldType) {
    return ContentTypeHelper.unsupportedFieldTypes().includes(fieldType);
  },
  isMediaType(fieldType) {
    return ContentTypeHelper.FIELD_TYPE_VIDEO_PICKER === fieldType || ContentTypeHelper.FIELD_TYPE_IMAGE_PICKER === fieldType;
  },
  isRteType(fieldType) {
    return ContentTypeHelper.FIELD_TYPE_RTE === fieldType;
  }
};

export default ContentTypeHelper;
