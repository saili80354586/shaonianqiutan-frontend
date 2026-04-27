import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';

describe('Card', () => {
  it('should render card with content', () => {
    render(<Card>Card Content</Card>);
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('should apply hover effect when hover prop is true', () => {
    const { container } = render(<Card hover>Hoverable Card</Card>);
    const card = container.firstChild;
    expect(card).toHaveClass('hover:border-accent/30');
  });

  it('should apply custom className', () => {
    const { container } = render(<Card className="custom-card">Custom</Card>);
    const card = container.firstChild;
    expect(card).toHaveClass('custom-card');
  });

  it('should render complete card structure', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card Description</CardDescription>
        </CardHeader>
        <CardContent>Main Content</CardContent>
        <CardFooter>Footer Content</CardFooter>
      </Card>
    );

    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Description')).toBeInTheDocument();
    expect(screen.getByText('Main Content')).toBeInTheDocument();
    expect(screen.getByText('Footer Content')).toBeInTheDocument();
  });

  it('should render CardTitle as h3', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Title</CardTitle>
        </CardHeader>
      </Card>
    );
    expect(screen.getByText('Title').tagName).toBe('H3');
  });
});
