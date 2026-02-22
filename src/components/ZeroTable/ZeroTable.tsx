export const ZeroTable = ({children}: {children: React.ReactNode}) => {
  return (
    <table style={{
      width: '100%',
      borderCollapse: 'collapse',
      backgroundColor: 'white',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      {children}
    </table>
  )
}

export const ZeroTableHeader = ({ children }: { children: React.ReactNode }) => {
  return (
    <thead>
      <tr style={{
        backgroundColor: '#f9fafb',
        borderBottom: '1px solid #e5e7eb'
      }}>
        {children}
      </tr>
    </thead>
  );
}

export const ZeroTableBody = ({ children }: { children: React.ReactNode }) => {
  return (
    <tbody>
      {children}
    </tbody>
  );
}


export const ZeroTableHeaderTitle = ({title}: { title: string }) => { 
  return (
    <th style={{
      padding: '16px 24px',
      textAlign: 'left',
      fontSize: '12px',
      fontWeight: '600',
      color: '#6b7280',
      textTransform: 'uppercase',
      letterSpacing: '0.05em'
    }}>
      {title}
    </th>
  );
}

export const ZeroTableRow = ({isLastItem, isEven, onRowClick, children}: {isLastItem: boolean; isEven: boolean; onRowClick?: () => void; children: React.ReactNode}) => {
  return (
    <tr 
      style={{
        borderBottom: !isLastItem ? '1px solid #f3f4f6' : 'none',
        backgroundColor: isEven ? 'white' : '#fafafa',
        cursor: "pointer"
      }}
      onMouseEnter={(e) => {
        const tr = e.currentTarget;
        tr.style.backgroundColor = '#f9fafb';
      }}
      onMouseLeave={(e) => {
        const tr = e.currentTarget;
        tr.style.backgroundColor = isEven ? 'white' : '#fafafa';
      }}
      onClick={onRowClick}
    >
      {children}
    </tr>
  );
}

export const ZeroTableRowColumnValue = ({ children }: { children: React.ReactNode }) => {
  return (
    <td style={{
      padding: '16px 24px',
      fontSize: '14px',
      color: '#111827'
    }}>
      { children }
    </td>
  );
}