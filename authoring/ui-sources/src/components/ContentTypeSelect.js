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
import {
  InputLabel,
  MenuItem,
  Select,
  FormControl,
} from '@mui/material';

import StudioAPI from '../api/studio';
import { contentTypeSub } from '../services/subscribe';

export default function ContentTypeSelect() {
  const [contentType, setContentType] = React.useState('');
  const [contentTypes, setContentTypes] = React.useState([]);

  React.useEffect(() => {
    (async () => {
      const data = await StudioAPI.getContentTypes();
      setContentTypes(data);
    })();
  }, []);

  const handleChange = (event) => {
    const newContentType = event.target.value;
    if (newContentType) {
      setContentType(newContentType);
      contentTypeSub.next(newContentType);
    }
  };

  return (
    <FormControl fullWidth>
      <InputLabel id="select-content-type">Content Type</InputLabel>
      <Select
        labelId="select-content-type"
        id="select-content-type-id"
        value={contentType}
        onChange={handleChange}
        label="Content Type"
      >
        <MenuItem value="">
          <em>None</em>
        </MenuItem>
        {contentTypes.map((ct) => (
          <MenuItem key={ct.name} value={ct.name}>
            {ct.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}