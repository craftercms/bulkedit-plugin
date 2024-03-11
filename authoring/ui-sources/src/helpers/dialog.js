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

const DialogHelper = {
  showEditDialog: (payload, success, failed) => {
    const eventId = 'bulkEditDialogCallback';
    CrafterCMSNext.system.store.dispatch({
      type: 'SHOW_EDIT_DIALOG',
      payload: Object.assign(payload, {
        onSaveSuccess: {
          type: 'BATCH_ACTIONS',
          payload: [
            {
              type: 'DISPATCH_DOM_EVENT',
              payload: { id: eventId, type: 'success' }
            },
            {
              type: 'SHOW_EDIT_ITEM_SUCCESS_NOTIFICATION',
            },
            {
              type: 'CLOSE_EDIT_DIALOG'
            }
          ]
        },
        onClose: {
          type: 'BATCH_ACTIONS',
          payload: [
            { type: 'CLOSE_EDIT_DIALOG' },
            {
              type: 'DISPATCH_DOM_EVENT',
              payload: { id: eventId, type: 'close' }
            }
          ]
        }
      })
    });
    CrafterCMSNext.createLegacyCallbackListener(eventId, (response) => {
      if (response.type === 'EMBEDDED_LEGACY_FORM_SUCCESS' || response.type === 'success') {
        success(response);
      } else {
        failed(response);
      }
    });
  }
};

export default DialogHelper;
