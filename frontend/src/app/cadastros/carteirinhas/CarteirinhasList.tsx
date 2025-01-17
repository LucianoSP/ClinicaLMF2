import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Tooltip,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { supabase } from '../../../utils/supabaseClient';

interface Carteirinha {
  id: number;
  numero_carteirinha: string;
  data_validade: string;
  paciente_id: number;
  plano_saude_id: number;
  paciente_nome?: string;
  plano_saude_nome?: string;
}

export default function CarteirinhasList() {
  const [carteirinhas, setCarteirinhas] = useState<Carteirinha[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCarteirinha, setSelectedCarteirinha] = useState<Carteirinha | null>(null);

  const fetchCarteirinhas = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('carteirinhas')
        .select(`
          *,
          pacientes (nome),
          planos_saude (nome)
        `);

      if (error) throw error;

      const formattedData = data.map((item: any) => ({
        id: item.id,
        numero_carteirinha: item.numero_carteirinha,
        data_validade: item.data_validade,
        paciente_id: item.paciente_id,
        plano_saude_id: item.plano_saude_id,
        paciente_nome: item.pacientes?.nome,
        plano_saude_nome: item.planos_saude?.nome
      }));

      setCarteirinhas(formattedData);
    } catch (error) {
      console.error('Error fetching carteirinhas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarteirinhas();
  }, []);

  const columns: GridColDef[] = [
    { field: 'numero_carteirinha', headerName: 'Número da Carteirinha', width: 200 },
    { field: 'data_validade', headerName: 'Data de Validade', width: 150 },
    { field: 'paciente_nome', headerName: 'Paciente', width: 200 },
    { field: 'plano_saude_nome', headerName: 'Plano de Saúde', width: 200 },
    {
      field: 'actions',
      headerName: 'Ações',
      width: 120,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Editar">
            <IconButton
              onClick={() => handleEdit(params.row)}
              size="small"
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Excluir">
            <IconButton
              onClick={() => handleDelete(params.row)}
              size="small"
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const handleAdd = () => {
    setSelectedCarteirinha(null);
    setOpenDialog(true);
  };

  const handleEdit = (carteirinha: Carteirinha) => {
    setSelectedCarteirinha(carteirinha);
    setOpenDialog(true);
  };

  const handleDelete = async (carteirinha: Carteirinha) => {
    if (window.confirm('Deseja realmente excluir esta carteirinha?')) {
      try {
        const { error } = await supabase
          .from('carteirinhas')
          .delete()
          .eq('id', carteirinha.id);

        if (error) throw error;

        fetchCarteirinhas();
      } catch (error) {
        console.error('Error deleting carteirinha:', error);
      }
    }
  };

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      <Box sx={{ p: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
        >
          Nova Carteirinha
        </Button>
      </Box>
      <DataGrid
        rows={carteirinhas}
        columns={columns}
        pageSize={10}
        rowsPerPageOptions={[10]}
        disableSelectionOnClick
        loading={loading}
        autoHeight
      />
    </Paper>
  );
}