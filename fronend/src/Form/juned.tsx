import React, { useState, useEffect } from 'react';
import { AstrolabeModule } from './astrolabe';
import {
  Card,
  CardHeader,
  CardContent,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
} from '@mui/material';
import { KubeObjectInterface, KubeObject } from '@kinvolk/headlamp-plugin/lib/K8s/cluster';
import {
  EditorDialog,
  EditButton,
  CreateButton,
  CreateResourceButton,
  ActionButton,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/CommonComponents';

return (
  <>
    <SectionBox title="Create Module">
      <Card
        elevation={3}
        sx={{
          borderRadius: 3,
          maxWidth: 600,
          margin: '0 auto',
          bgcolor: theme => (theme.palette.mode === 'dark' ? '#23272f' : '#fff'),
        }}
      >
        {' '}
      </Card>
      <Grid>
        <EditButton
          buttonStyle="menu"
          item={new KubeObject(moduleResource)}
          afterConfirm={() => setOpenEditor(true)}
        />
      </Grid>
      <Grid>
        <CreateButton isNarrow={false}></CreateButton>
      </Grid>

      <Grid>
        <CreateResourceButton resourceClass={AstrolabeModule} resourceName="junedtestmodule" />
      </Grid>

      <Dialog open={openEditor} onClose={() => setOpenEditor(false)} fullWidth maxWidth="md">
        <DialogTitle>Create Module Resource</DialogTitle>
        <EditorDialog
          // item={moduleResource as KubeObjectInterface}
          item={itemRef.current}
          setOpen={setOpenEditor}
          onClose={() => setOpenEditor(false)}
          onSave={handleSave}
          saveLabel="Apply"
          errorMessage={errorMessage}
          onEditorChanged={() => setErrorMessage(undefined)}
          title="Module YAML Editor"
        />
      </Dialog>
    </SectionBox>
  </>
);
