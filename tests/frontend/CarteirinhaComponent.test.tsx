import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CarteirinhaForm } from '../src/components/CarteirinhaForm';
import { CarteirinhaList } from '../src/components/CarteirinhaList';
import { createCarteirinha, updateCarteirinha, deleteCarteirinha } from '../src/services/api';

// Mock the API calls
jest.mock('../src/services/api', () => ({
  createCarteirinha: jest.fn(),
  updateCarteirinha: jest.fn(),
  deleteCarteirinha: jest.fn(),
}));

describe('CarteirinhaForm Component', () => {
  const mockCarteirinha = {
    id: '1',
    numero: '123456789',
    validade: '2024-12-31',
    plano_id: '1',
    paciente_id: '1'
  };

  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders form with all fields', () => {
    render(<CarteirinhaForm onSubmit={mockOnSubmit} />);
    
    expect(screen.getByLabelText(/número/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/validade/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/plano/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/paciente/i)).toBeInTheDocument();
  });

  test('validates required fields', async () => {
    render(<CarteirinhaForm onSubmit={mockOnSubmit} />);
    
    fireEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(screen.getByText(/número é obrigatório/i)).toBeInTheDocument();
      expect(screen.getByText(/validade é obrigatória/i)).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  test('submits form with valid data', async () => {
    render(<CarteirinhaForm onSubmit={mockOnSubmit} />);
    
    fireEvent.change(screen.getByLabelText(/número/i), {
      target: { value: mockCarteirinha.numero },
    });
    fireEvent.change(screen.getByLabelText(/validade/i), {
      target: { value: mockCarteirinha.validade },
    });
    fireEvent.change(screen.getByLabelText(/plano/i), {
      target: { value: mockCarteirinha.plano_id },
    });
    fireEvent.change(screen.getByLabelText(/paciente/i), {
      target: { value: mockCarteirinha.paciente_id },
    });

    fireEvent.click(screen.getByRole('button', { name: /salvar/i }));

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        numero: mockCarteirinha.numero,
        validade: mockCarteirinha.validade,
        plano_id: mockCarteirinha.plano_id,
        paciente_id: mockCarteirinha.paciente_id,
      }));
    });
  });
});

describe('CarteirinhaList Component', () => {
  const mockCarteirinhas = [
    {
      id: '1',
      numero: '123456789',
      validade: '2024-12-31',
      plano_id: '1',
      paciente_id: '1',
      plano: { nome: 'Plano A' },
      paciente: { nome: 'Paciente A' }
    },
    {
      id: '2',
      numero: '987654321',
      validade: '2025-12-31',
      plano_id: '2',
      paciente_id: '2',
      plano: { nome: 'Plano B' },
      paciente: { nome: 'Paciente B' }
    }
  ];

  test('renders list of carteirinhas', () => {
    render(<CarteirinhaList carteirinhas={mockCarteirinhas} />);

    mockCarteirinhas.forEach(carteirinha => {
      expect(screen.getByText(carteirinha.numero)).toBeInTheDocument();
      expect(screen.getByText(carteirinha.plano.nome)).toBeInTheDocument();
      expect(screen.getByText(carteirinha.paciente.nome)).toBeInTheDocument();
    });
  });

  test('handles delete carteirinha', async () => {
    render(<CarteirinhaList carteirinhas={mockCarteirinhas} />);

    const deleteButtons = screen.getAllByRole('button', { name: /excluir/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(deleteCarteirinha).toHaveBeenCalledWith(mockCarteirinhas[0].id);
    });
  });

  test('handles edit carteirinha', () => {
    render(<CarteirinhaList carteirinhas={mockCarteirinhas} />);

    const editButtons = screen.getAllByRole('button', { name: /editar/i });
    fireEvent.click(editButtons[0]);

    expect(screen.getByDisplayValue(mockCarteirinhas[0].numero)).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockCarteirinhas[0].validade)).toBeInTheDocument();
  });

  test('displays message when no carteirinhas exist', () => {
    render(<CarteirinhaList carteirinhas={[]} />);

    expect(screen.getByText(/nenhuma carteirinha encontrada/i)).toBeInTheDocument();
  });

  test('handles error state', async () => {
    deleteCarteirinha.mockRejectedValueOnce(new Error('Failed to delete'));
    
    render(<CarteirinhaList carteirinhas={mockCarteirinhas} />);

    const deleteButtons = screen.getAllByRole('button', { name: /excluir/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText(/erro ao excluir carteirinha/i)).toBeInTheDocument();
    });
  });
});