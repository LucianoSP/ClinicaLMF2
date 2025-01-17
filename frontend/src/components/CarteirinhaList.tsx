import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Typography,
  CircularProgress,
  Box,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { format } from 'date-fns';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ErrorAlert from './ErrorAlert';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';

interface Carteirinha {
  id: number;
  numero: string;
  plano_saude: {
    id: number;
    nome: string;
  };
  titular: string;
  data_validade: string;
}

const CarteirinhaList: React.FC = () => {
  const [carteirinhas, setCarteirinhas] = useState<Carteirinha[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCarteirinha, setSelectedCarteirinha] = useState<number | null>(null);
  const navigate = useNavigate();

  const fetchCarteirinhas = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/carteirinhas');
      setCarteirinhas(response.data);
      setError(null);
    } catch (err) {
      setError('Erro ao carregar as carteirinhas. Por favor, tente novamente.');
      console.error('Error fetching carteirinhas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarteirinhas();
  }, []);

  const handleEdit = (id: number) => {
    navigate(`/carteirinhas/edit/${id}`);
  };

  const handleDeleteClick = (id: number) => {
    setSelectedCarteirinha(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedCarteirinha) {
      try {
        await axios.delete(`/api/carteirinhas/${selectedCarteirinha}`);
        await fetchCarteirinhas();
        setError(null);
      } catch (err) {
        setError('Erro ao excluir a carteirinha. Por favor, tente novamente.');
        console.error('Error deleting carteirinha:', err);
      }
    }
    setDeleteDialogOpen(false);
    setSelectedCarteirinha(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div>
      {error && <ErrorAlert message={error} />}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Número da Carteirinha</TableCell>
              <TableCell>Plano de Saúde</TableCell>
              <TableCell>Titular</TableCell>
              <TableCell>Data de Validade</TableCell>
              <TableCell align="right">Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {carteirinhas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography align="center">Nenhuma carteirinha encontrada</Typography>
                </TableCell>
              </TableRow>
            ) : (
              carteirinhas.map((carteirinha) => (
                <TableRow key={carteirinha.id}>
                  <TableCell>{carteirinha.numero}</TableCell>
                  <TableCell>{carteirinha.plano_saude.nome}</TableCell>
                  <TableCell>{carteirinha.titular}</TableCell>
                  <TableCell>
                    {format(new Date(carteirinha.data_validade), 'dd/MM/yyyy')}
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      onClick={() => handleEdit(carteirinha.id)}
                      color="primary"
                      size="small"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={() => handleDeleteClick(carteirinha.id)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Excluir Carteirinha"
        content="Tem certeza que deseja excluir esta carteirinha? Esta ação não pode ser desfeita."
      />
    </div>
  );
};

export default CarteirinhaList;