import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';

describe('Card Components', () => {
  describe('Card', () => {
    it('renders card element', () => {
      const { container } = render(<Card>Content</Card>);
      expect(container.querySelector('[role="region"]')).toBeInTheDocument();
    });

    it('renders children', () => {
      render(<Card>Test Content</Card>);
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });

  describe('CardHeader', () => {
    it('renders card header', () => {
      const { container } = render(
        <Card>
          <CardHeader>Header</CardHeader>
        </Card>
      );
      expect(screen.getByText('Header')).toBeInTheDocument();
    });
  });

  describe('CardTitle', () => {
    it('renders card title as heading', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
        </Card>
      );
      const heading = screen.getByRole('heading');
      expect(heading).toHaveTextContent('Title');
    });
  });

  describe('CardDescription', () => {
    it('renders card description', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
            <CardDescription>Description text</CardDescription>
          </CardHeader>
        </Card>
      );
      expect(screen.getByText('Description text')).toBeInTheDocument();
    });
  });

  describe('CardContent', () => {
    it('renders card content', () => {
      render(
        <Card>
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
          <CardContent>Content here</CardContent>
        </Card>
      );
      expect(screen.getByText('Content here')).toBeInTheDocument();
    });
  });

  it('renders complete card structure', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Complete Card</CardTitle>
          <CardDescription>This is a description</CardDescription>
        </CardHeader>
        <CardContent>Main content goes here</CardContent>
      </Card>
    );

    expect(screen.getByText('Complete Card')).toBeInTheDocument();
    expect(screen.getByText('This is a description')).toBeInTheDocument();
    expect(screen.getByText('Main content goes here')).toBeInTheDocument();
  });
});
