import React from 'react';
import { Box, Tab } from '@mui/material';
import { TabContext, TabList, TabPanel } from '@mui/lab';

import PacientesList from './pacientes/PacientesList';
import PlanosSaudeList from './planos-saude/PlanosSaudeList';
import CarteirinhasList from '../../components/carteirinhas/CarteirinhasList';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: string;
}

export default function Cadastros() {
  const [value, setValue] = React.useState('1');

  const handleChange = (event: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%', typography: 'body1' }}>
      <TabContext value={value}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <TabList onChange={handleChange} aria-label="Abas de cadastro">
            <Tab label="Pacientes" value="1" />
            <Tab label="Planos de Saúde" value="2" />
            <Tab label="Carteirinhas" value="3" />
          </TabList>
        </Box>
        <TabPanel value="1">
          <PacientesList />
        </TabPanel>
        <TabPanel value="2">
          <PlanosSaudeList />
        </TabPanel>
        <TabPanel value="3">
          <CarteirinhasList />
        </TabPanel>
      </TabContext>
    </Box>
  );
}