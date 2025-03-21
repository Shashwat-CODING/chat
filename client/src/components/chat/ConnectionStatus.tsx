import { type ConnectionStatus } from '@/lib/socket';

interface ConnectionStatusProps {
  status: ConnectionStatus;
}

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  const getStatusStyles = () => {
    switch (status) {
      case 'connected':
        return {
          container: 'bg-green-100 text-green-800',
          dot: 'bg-green-500'
        };
      case 'connecting':
        return {
          container: 'bg-yellow-100 text-yellow-800',
          dot: 'bg-yellow-500'
        };
      case 'disconnected':
        return {
          container: 'bg-red-100 text-red-800',
          dot: 'bg-red-500'
        };
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'disconnected':
        return 'Disconnected';
    }
  };

  const styles = getStatusStyles();

  return (
    <div className={`flex items-center px-2 py-1 rounded-full ${styles.container} text-xs font-medium`}>
      <span className={`h-2 w-2 rounded-full ${styles.dot} mr-1.5`}></span>
      <span>{getStatusText()}</span>
    </div>
  );
}

export default ConnectionStatus;
