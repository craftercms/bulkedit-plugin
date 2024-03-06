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
  Box,
  CssBaseline,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Drawer,
  IconButton,
  styled,
  Tooltip,
} from '@mui/material';

import FindReplaceIcon from '@mui/icons-material/FindReplace';
import FilterListIcon from '@mui/icons-material/FilterList';
import SaveIcon from '@mui/icons-material/Save';
import ClearIcon from '@mui/icons-material/Clear';
import MenuIcon from '@mui/icons-material/Menu';

import ContentTypeSelect from './ContentTypeSelect';
import FindAndReplace from './FindAndReplace';
import FilterDialog from './Filter';
import DataSheet from './DataSheet';

const DRAWER_WIDTH = 240;

const TEXT_FIND_REPLACE = 'Find and Replace';
const TEXT_FILTER = 'Apply Filters';
const TEXT_SAVE = 'Save all changes';
const TEXT_CANCEL = 'Cancel All Change';

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    overflow: 'auto',
    padding: theme.spacing(3),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginLeft: `-${DRAWER_WIDTH}px`,
    ...(open && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    }),
  }),
);

const StyledIconButton = styled(IconButton)(
  ({ theme }) => ({
    color: 'rgba(0, 0, 0, 0.54)',
  }),
);

export default function Editor() {
  const [drawerOpen, setDrawerOpen] = React.useState(true);
  const [findReplaceDialogOpen, setFindReplaceDialogOpen] = React.useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = React.useState(false);

  const rootRef = React.useRef(null);
  const dataSheetRef = React.useRef(null);

  const handleFindReplaceDialogClose = () => {
    setFindReplaceDialogOpen(false);
  };

  const handleFilterDialogClose = () => {
    setFilterDialogOpen(false);
  };

  const handleSaveChangeClick = () => {
    (async () => {
      dataSheetRef.current.saveAllChanges();
    })();
  };

  const handleCancelAllChangeClick = () => {
    (async () => {
      dataSheetRef.current.cancelAllChanges();
    })();
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const appbar = (
    <Box position="relative">
      <Toolbar>
        <StyledIconButton
          color="inherit"
          aria-label="open drawer"
          onClick={toggleDrawer}
          edge="start"
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </StyledIconButton>
        {!drawerOpen && (
          <div style={{ position: 'absolute', right: '0px' }}>
            <Tooltip title={TEXT_FIND_REPLACE}>
              <StyledIconButton
                color="inherit"
                aria-label={TEXT_FIND_REPLACE}
                onClick={() => setFindReplaceDialogOpen(true)}
                edge="start"
                sx={{ mr: 2 }}
              >
                <FindReplaceIcon />
              </StyledIconButton>
            </Tooltip>
            <Tooltip title={TEXT_FILTER}>
              <StyledIconButton
                color="inherit"
                aria-label={TEXT_FILTER}
                onClick={() => setFilterDialogOpen(true)}
                edge="start"
                sx={{ mr: 2 }}
              >
                <FilterListIcon />
              </StyledIconButton>
            </Tooltip>
            <Tooltip title={TEXT_SAVE}>
              <StyledIconButton
                color="inherit"
                aria-label={TEXT_SAVE}
                onClick={handleSaveChangeClick}
                edge="start"
                sx={{ mr: 2 }}
              >
                <SaveIcon />
              </StyledIconButton>
            </Tooltip>
            <Tooltip title={TEXT_CANCEL}>
              <StyledIconButton
                color="inherit"
                aria-label={TEXT_CANCEL}
                onClick={handleCancelAllChangeClick}
                edge="start"
                sx={{ mr: 2 }}
              >
                <ClearIcon />
              </StyledIconButton>
            </Tooltip>
          </div>
        )}
      </Toolbar>
    </Box>
  );

  const drawer = (
    <Drawer
      variant="persistent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
        },
      }}
      PaperProps={{
        style: {
          position: "absolute",
          width: DRAWER_WIDTH,
          top: "155px",
          left: "13px",
          height: "auto"
        }
      }}
      BackdropProps={{ style: { position: "absolute" } }}
      open={drawerOpen}
      ModalProps={{
        container: document.getElementById("drawer-container"),
        style: { position: 'absolute' },
        disableEnforceFocus: true,
        keepMounted: true,
      }}
      SlideProps={{
        onExiting: (node) => {
          node.style.transform = "scaleX(0)";
          node.style.transformOrigin = "top left";
        },
      }}
    >
      <List>
        <ListItem>
          <ContentTypeSelect />
        </ListItem>
      </List>
      <Divider />
      <List>
        <ListItemButton key={TEXT_FIND_REPLACE} onClick={() => setFindReplaceDialogOpen(true)}>
              <ListItemIcon>
                <FindReplaceIcon />
              </ListItemIcon>
              <ListItemText primary={TEXT_FIND_REPLACE} />
        </ListItemButton>
        <ListItemButton key={TEXT_FILTER} onClick={() => setFilterDialogOpen(true)}>
          <ListItemIcon>
            <FilterListIcon />
          </ListItemIcon>
          <ListItemText primary={TEXT_FILTER} />
        </ListItemButton>
      </List>
      <Divider />
      <List>
        <ListItemButton key={TEXT_SAVE} onClick={handleSaveChangeClick}>
          <ListItemIcon>
            <SaveIcon />
          </ListItemIcon>
          <ListItemText primary={TEXT_SAVE} />
        </ListItemButton>
        <ListItemButton key={TEXT_CANCEL} onClick={handleCancelAllChangeClick}>
          <ListItemIcon>
            <ClearIcon />
          </ListItemIcon>
          <ListItemText primary={TEXT_CANCEL} />
        </ListItemButton>
      </List>
      <Divider />
    </Drawer>
  );

  return (
    <Box>
      <CssBaseline />
      {appbar}
      <section
        id="drawer-container"
        position="relative"
        bgcolor="white"
        component="div"
        style={{
          overflowY: "scroll",
          overflowX: "hidden",
          display: "flex",
          border: "1px solid #e0e0e0",
          height: "calc(100vh - 194px)",
        }}
        ref={rootRef}
      >
        {drawer}
        <Main open={drawerOpen}>
          <DataSheet ref={dataSheetRef} />
        </Main>
      </section>
      <FindAndReplace isOpen={findReplaceDialogOpen} handleClose={handleFindReplaceDialogClose} />
      <FilterDialog isOpen={filterDialogOpen} handleClose={handleFilterDialogClose} />
    </Box>
  );
};
