import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmDialog from './ConfirmDialog.jsx';

const setup = (props = {}) => {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();
  render(
    <ConfirmDialog
      open
      title="Delete listing?"
      description="This cannot be undone."
      confirmLabel="Delete"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...props}
    />
  );
  return { onConfirm, onCancel };
};

describe('ConfirmDialog', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <ConfirmDialog open={false} title="Hidden" onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(container.innerHTML).toBe('');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('renders an accessible modal dialog with its title and description', () => {
    setup();
    const dialog = screen.getByRole('dialog', { name: 'Delete listing?' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(screen.getByText('This cannot be undone.')).toBeTruthy();
  });

  it('calls onConfirm and onCancel from the action buttons', async () => {
    const user = userEvent.setup();
    const { onConfirm, onCancel } = setup();

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape', () => {
    const { onCancel } = setup();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('closes when the backdrop is clicked but not when the panel is', () => {
    const { onCancel } = setup();
    fireEvent.mouseDown(screen.getByRole('dialog'));
    expect(onCancel).not.toHaveBeenCalled();
    fireEvent.mouseDown(screen.getByRole('presentation'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('locks the actions and ignores Escape while busy', () => {
    const { onCancel } = setup({ busy: true });
    expect(screen.getByRole('button', { name: 'Working...' }).disabled).toBe(true);
    expect(screen.getByRole('button', { name: 'Cancel' }).disabled).toBe(true);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('disables only the confirm button when confirmDisabled is set', () => {
    setup({ confirmDisabled: true });
    expect(screen.getByRole('button', { name: 'Delete' }).disabled).toBe(true);
    expect(screen.getByRole('button', { name: 'Cancel' }).disabled).toBe(false);
  });

  it('uses the danger style when requested', () => {
    setup({ danger: true });
    expect(screen.getByRole('button', { name: 'Delete' }).className).toContain('btn-danger');
  });

  it('locks page scrolling while open and restores it on close', () => {
    document.body.style.overflow = 'auto';
    const { rerender } = render(
      <ConfirmDialog open title="T" onConfirm={vi.fn()} onCancel={vi.fn()} />
    );
    expect(document.body.style.overflow).toBe('hidden');
    rerender(<ConfirmDialog open={false} title="T" onConfirm={vi.fn()} onCancel={vi.fn()} />);
    expect(document.body.style.overflow).toBe('auto');
  });
});
