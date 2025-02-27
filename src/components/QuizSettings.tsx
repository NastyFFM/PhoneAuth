import { useState, useEffect } from 'react';
import { userService } from '@/services/userService';

interface QuizSettingsProps {
  cooldownType: 'minute' | 'nextDay';
  onCooldownTypeChange: (type: 'minute' | 'nextDay') => void;
}

export function QuizSettings({ cooldownType, onCooldownTypeChange }: QuizSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const handleCooldownChange = async (type: 'minute' | 'nextDay') => {
    try {
      setIsLoading(true);
      // Speichere die Einstellung in der Datenbank
      await userService.saveGlobalSettings({ cooldownType: type });
      // Aktualisiere den lokalen State
      onCooldownTypeChange(type);
    } catch (error) {
      console.error('Error saving cooldown settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.9)',
      borderRadius: '20px',
      padding: '2rem',
      marginTop: '1rem'
    }}>
      <h2 style={{ marginBottom: '1rem' }}>Quiz-Einstellungen</h2>
      
      <div style={{ marginBottom: '1rem' }}>
        <p>Wartezeit zwischen Quizfragen:</p>
        
        <div style={{ 
          display: 'flex', 
          gap: '1rem',
          marginTop: '0.5rem' 
        }}>
          <button
            onClick={() => handleCooldownChange('minute')}
            disabled={isLoading}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: cooldownType === 'minute' ? '#1428A0' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {isLoading && cooldownType !== 'minute' ? 'Wird gespeichert...' : '1 Minute Wartezeit'}
          </button>
          
          <button
            onClick={() => handleCooldownChange('nextDay')}
            disabled={isLoading}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: cooldownType === 'nextDay' ? '#1428A0' : '#ccc',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {isLoading && cooldownType !== 'nextDay' ? 'Wird gespeichert...' : 'Bis 0:00 Uhr warten'}
          </button>
        </div>
      </div>
    </div>
  );
} 