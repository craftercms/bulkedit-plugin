/*
 * Copyright (C) 2007-2022 Crafter Software Corporation. All Rights Reserved.
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
import Typography from '@mui/material/Typography';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

export default function PathCell(props) {
  const { value, row } = props;

  return (
    <>
      <div
        style={{ cursor: 'auto' }}
      >
        <Typography
          variant="body2"
          style={{
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap'
          }}
        >
          {row.lockOwner && (
            <LockOutlinedIcon style={{ color: 'rgb(255, 149, 0)' }} />
          )}
          {value}
        </Typography>
      </div>
    </>
  );
};
