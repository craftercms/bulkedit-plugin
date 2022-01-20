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

import * as React from 'react';
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Box,
  Paper,
  styled,
  Radio,
  RadioGroup,
  FormControl,
  FormControlLabel,
  FormLabel,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckIcon from '@mui/icons-material/Check';
import Draggable from 'react-draggable';

import { keywordSub, filterEditDateSub } from '../services/subscribe';

import DateHelper from '../helpers/date';

const StyledTextField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(2),
}));

const StyledButton = styled(Button)(({ theme }) => ({
  margin: '5px',
  float: 'right'
}));

function PaperComponent(props) {
  return (
    <Draggable
      handle="#draggable-filter-dialog-title"
      cancel={'[class*="MuiDialogContent-root"]'}
    >
      <Paper {...props} />
    </Draggable>
  );
}

const LastEditDateComponent = () => {
  const [lastEditOption, setLastEditOption] = React.useState('');
  const lastEditDateOptions = {
    today: 'Today',
    'in-last-week': 'In last week',
    'over-a-week-ago': 'Over a week ago',
    'over-a-month-ago': 'Over a month ago',
    'over-six-months-ago': 'Over six months ago',
    'over-a-year-ago': 'Over a year ago',
  };

  const getDateFromOption = (option) => {
    const today = new Date();

    const dateFilter = {
      id: `last-edit-date${option}`,
      min: null,
      max: null,
    };

    switch (option) {
      case 'today': {
        dateFilter.min = DateHelper.getFormatDate(DateHelper.getShiftDate(today, -1));
        dateFilter.max = DateHelper.getFormatDate(DateHelper.getShiftDate(today, 1));
        break;
      }

      case 'in-last-week': {
        dateFilter.min = DateHelper.getFormatDate(DateHelper.getShiftDate(today, -7));
        dateFilter.max = DateHelper.getFormatDate(DateHelper.getShiftDate(today, -1));
        break;
      }

      case 'over-a-week-ago': {
        dateFilter.max = DateHelper.getFormatDate(DateHelper.getShiftDate(today, -8));
        break;
      }

      case 'over-a-month-ago': {
        dateFilter.max = DateHelper.getFormatDate(DateHelper.getShiftDate(today, -30));
        break;
      }

      case 'over-six-months-ago': {
        dateFilter.max = DateHelper.getFormatDate(DateHelper.getShiftDate(today, -30*6));
        break;
      }

      case 'over-a-year-ago': {
        dateFilter.max = DateHelper.getFormatDate(DateHelper.getShiftDate(today, -365));
        break;
      }

      default:
        break;
    }

    return dateFilter;
  };

  const keys = Object.keys(lastEditDateOptions);
  const options = [];
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    const value = lastEditDateOptions[key];
    options.push((
      <FormControlLabel value={key} control={<Radio />} label={value} />
    ));
  }

  React.useEffect(() => {
    const filter = getDateFromOption(lastEditOption);
    filterEditDateSub.next(filter);
  }, [lastEditOption]);

  return (
    <div>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <Typography>Last Edit Date</Typography>
          {lastEditOption && <CheckIcon />}
        </AccordionSummary>
        <AccordionDetails>
          <StyledButton variant="outlined" onClick={() => setLastEditOption('')}>Clear</StyledButton>
          <FormControl component="fieldset">
            <FormLabel component="legend">Last Edit Date</FormLabel>
            <RadioGroup
              aria-label="last-edit-date"
              value={lastEditOption}
              onChange={(event) => setLastEditOption(event.target.value)}
              name="radio-buttons-group"
            >
              {options}
            </RadioGroup>
          </FormControl>
        </AccordionDetails>
      </Accordion>
    </div>
  );
};

export default function FilterDialog({ isOpen, handleClose }) {
  const [keyword, setKeyword] = React.useState('');

  const handleApplyFilters = () => {
    keywordSub.next(keyword);
  };

  const handleResetFilters = () => {
    keywordSub.next('');
    filterEditDateSub.next(null);
    handleClose();
  };

  return (
    <div>
      <Dialog
        maxWidth="md"
        aria-labelledby="draggable-filter-dialog-title"
        PaperComponent={PaperComponent}
        open={isOpen}
        onClose={handleClose}
      >
        <DialogTitle
          style={{ cursor: 'move' }}
          id="draggable-filter-dialog-title"
        >
          Apply Filter
        </DialogTitle>
        <DialogContent>
        <Box
          component="form"
          noValidate
          autoComplete="off"
          sx={{ padding: '16px' }}
        >
          <StyledTextField
            fullWidth
            id="search"
            label="Keyword"
            placeholder="Filter by a keyword"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </Box>
        <Box>
          <LastEditDateComponent />
        </Box>
        </DialogContent>
        <DialogActions>
          <Box>
            <StyledButton variant="outlined" onClick={handleClose}>Done</StyledButton>
            <StyledButton
              variant="outlined"
              onClick={handleResetFilters}
            >
              Reset Filters
            </StyledButton>
            <StyledButton
              variant="outlined"
              onClick={handleApplyFilters}
            >
              Apply Filters
            </StyledButton>
          </Box>
        </DialogActions>
      </Dialog>
    </div>
  );
};
