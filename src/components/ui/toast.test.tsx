import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Toast, ToastContainer } from './toast';

describe('Toast', () => {
  it('should render toast with title', () => {
    render(<Toast id="1" title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('should render toast with description', () => {
    render(<Toast id="1" title="Title" description="Test description" />);
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', async () => {
    vi.useFakeTimers();
    const handleClose = vi.fn();
    render(<Toast id="toast-1" title="Test" onClose={handleClose} />);
    
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[buttons.length - 1]);
    
    // 等待动画完成后的延迟
    act(() => {
      vi.advanceTimersByTime(350);
    });
    
    expect(handleClose).toHaveBeenCalledWith('toast-1');
    vi.useRealTimers();
  });

  it('should auto close after duration', () => {
    vi.useFakeTimers();
    const handleClose = vi.fn();
    
    render(<Toast id="1" title="Test" onClose={handleClose} duration={1000} />);
    
    act(() => {
      vi.advanceTimersByTime(1300);
    });
    
    expect(handleClose).toHaveBeenCalledWith('1');
    vi.useRealTimers();
  });
});

describe('ToastContainer', () => {
  it('should render multiple toasts', () => {
    const toasts = [
      { id: '1', title: 'Toast 1' },
      { id: '2', title: 'Toast 2' },
    ];
    
    render(<ToastContainer toasts={toasts} onClose={() => {}} />);
    
    expect(screen.getByText('Toast 1')).toBeInTheDocument();
    expect(screen.getByText('Toast 2')).toBeInTheDocument();
  });

  it('should render empty when no toasts', () => {
    const { container } = render(<ToastContainer toasts={[]} onClose={() => {}} />);
    expect(container.firstChild).toBeEmptyDOMElement();
  });
});
