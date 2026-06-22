import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const user = userEvent.setup();
    let clicked = false;

    render(
      <Button onClick={() => { clicked = true; }}>
        Click me
      </Button>
    );

    await user.click(screen.getByRole('button', { name: /click me/i }));
    expect(clicked).toBe(true);
  });

  it('renders disabled state', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button', { name: /disabled/i })).toBeDisabled();
  });

  it('renders different variants', () => {
    render(
      <>
        <Button variant="outline">Outline</Button>
        <Button variant="destructive">Destructive</Button>
        <Button variant="ghost">Ghost</Button>
      </>
    );

    expect(screen.getByRole('button', { name: /outline/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /destructive/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ghost/i })).toBeInTheDocument();
  });

  it('renders different sizes', () => {
    render(
      <>
        <Button size="sm">Small</Button>
        <Button size="lg">Large</Button>
        <Button size="icon">Icon</Button>
      </>
    );

    expect(screen.getByRole('button', { name: /small/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /large/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /icon/i })).toBeInTheDocument();
  });
});
