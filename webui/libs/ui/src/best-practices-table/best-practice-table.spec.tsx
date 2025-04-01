import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { Row } from '@tanstack/react-table';

import BestPracticeTable from './best-practice-table';

interface TestData {
  id: number;
  name: string;
  value: number;
}

describe('BestPracticeTable', () => {
  const mockData: TestData[] = [
    { id: 1, name: 'Test 1', value: 100 },
    { id: 2, name: 'Test 2', value: 200 },
  ];

  const mockColumns = [
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'value',
      header: 'Value',
    },
  ];

  it('renders table with data and columns', () => {
    render(<BestPracticeTable data={mockData} columns={mockColumns} />);

    // Check headers
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();

    // Check data
    expect(screen.getByText('Test 1')).toBeInTheDocument();
    expect(screen.getByText('Test 2')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
  });

  it('renders empty table when no data is provided', () => {
    render(<BestPracticeTable data={[]} columns={mockColumns} />);

    // Check headers are still present
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Value')).toBeInTheDocument();

    // Check no data rows are present
    expect(screen.queryByText('Test 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Test 2')).not.toBeInTheDocument();
  });

  it('renders custom cell content', () => {
    const customColumns = [
      {
        accessorKey: 'name',
        header: 'Name',
        cell: ({ row }: { row: Row<TestData> }) => (
          <span data-testid="custom-cell">{row.original.name}</span>
        ),
      },
    ];

    render(<BestPracticeTable data={mockData} columns={customColumns} />);

    const customCells = screen.getAllByTestId('custom-cell');
    expect(customCells).toHaveLength(2);
    expect(customCells[0]).toHaveTextContent('Test 1');
    expect(customCells[1]).toHaveTextContent('Test 2');
  });

  it('renders custom header content', () => {
    const customColumns = [
      {
        accessorKey: 'name',
        header: () => <span data-testid="custom-header">Custom Header</span>,
      },
    ];

    render(<BestPracticeTable data={mockData} columns={customColumns} />);

    expect(screen.getByTestId('custom-header')).toBeInTheDocument();
    expect(screen.getByTestId('custom-header')).toHaveTextContent(
      'Custom Header'
    );
  });
});
