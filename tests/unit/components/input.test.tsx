import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '@/components/ui/input';

describe('Input Component', () => {
  it('renders input element', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('accepts placeholder text', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('handles text input', async () => {
    const user = userEvent.setup();
    const { container } = render(<Input />);
    const input = container.querySelector('input') as HTMLInputElement;

    await user.type(input, 'test value');
    expect(input.value).toBe('test value');
  });

  it('handles email input type', () => {
    render(<Input type="email" />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.type).toBe('email');
  });

  it('handles password input type', () => {
    const { container } = render(<Input type="password" />);
    const input = container.querySelector('input[type="password"]');
    expect(input).toBeInTheDocument();
  });

  it('handles disabled state', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('handles readonly state', () => {
    const { container } = render(<Input readOnly value="readonly" />);
    const input = container.querySelector('input[readonly]');
    expect(input).toBeInTheDocument();
  });

  it('accepts className prop', () => {
    const { container } = render(<Input className="custom-class" />);
    const input = container.querySelector('input');
    expect(input).toHaveClass('custom-class');
  });
});
