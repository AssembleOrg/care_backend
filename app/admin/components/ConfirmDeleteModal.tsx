'use client';

import { Modal, Text, TextInput, Button, Stack, Group } from '@mantine/core';
import { useState, useEffect } from 'react';
import { IconAlertTriangle } from '@tabler/icons-react';

interface ConfirmDeleteModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  itemName?: string;
  loading?: boolean;
}

export function ConfirmDeleteModal({
  opened,
  onClose,
  onConfirm,
  title,
  message,
  itemName,
  loading = false,
}: ConfirmDeleteModalProps) {
  const [confirmationText, setConfirmationText] = useState('');
  const CONFIRMATION_WORD = 'acepto';

  useEffect(() => {
    if (!opened) {
      setConfirmationText('');
    }
  }, [opened]);

  const isConfirmed = confirmationText.toLowerCase().trim() === CONFIRMATION_WORD;

  const handleConfirm = () => {
    if (isConfirmed) {
      onConfirm();
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconAlertTriangle size={20} color="red" />
          <Text fw={600}>{title}</Text>
        </Group>
      }
      centered
      size="md"
    >
      <Stack gap="md">
        <Text>{message}</Text>
        
        {itemName && (
          <Text size="sm" c="dimmed" fw={500}>
            {itemName}
          </Text>
        )}

        <Text size="sm" c="red" fw={500}>
          Esta acción no se puede deshacer.
        </Text>

        <TextInput
          label={
            <Text size="sm" fw={500}>
              Escribe <Text span fw={700} c="red">"{CONFIRMATION_WORD}"</Text> para confirmar:
            </Text>
          }
          placeholder={CONFIRMATION_WORD}
          value={confirmationText}
          onChange={(e) => setConfirmationText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && isConfirmed && !loading) {
              handleConfirm();
            }
          }}
          error={
            confirmationText && !isConfirmed
              ? `Debes escribir exactamente "${CONFIRMATION_WORD}"`
              : undefined
          }
        />

        <Group justify="flex-end" mt="md">
          <Button variant="subtle" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            color="red"
            onClick={handleConfirm}
            disabled={!isConfirmed || loading}
            loading={loading}
          >
            Confirmar Eliminación
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
