import * as React from 'react';
import Paper from '@mui/material/Paper';
import Vm from './Vm';

export default function Content() {
  return (
    <Paper sx={{ maxWidth: 936, margin: 'auto', padding: 2, overflow: 'hidden' }}>
      <Vm />
    </Paper>
  );
}
