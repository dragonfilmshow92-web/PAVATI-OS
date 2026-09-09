import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Delete, Calculator as CalcIcon } from 'lucide-react';

export default function CalculatorModal() {
  const { setModalState } = useApp();
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [isDone, setIsDone] = useState(false);

  const handleDigit = (digit) => {
    if (isDone || display === '0') {
      setDisplay(String(digit));
      setIsDone(false);
    } else {
      setDisplay(prev => prev + digit);
    }
  };

  const handleDecimal = () => {
    if (isDone) {
      setDisplay('0.');
      setIsDone(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(prev => prev + '.');
    }
  };

  const handleOperator = (op) => {
    setEquation(`${display} ${op} `);
    setDisplay('0');
    setIsDone(false);
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
    setIsDone(false);
  };

  const handleBackspace = () => {
    if (isDone) {
      handleClear();
      return;
    }
    if (display.length > 1) {
      setDisplay(prev => prev.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const handleCalculate = () => {
    if (!equation) return;
    try {
      const fullExpression = equation + display;
      const tokens = fullExpression.trim().split(/\s+/);
      if (tokens.length === 3) {
        const a = parseFloat(tokens[0]);
        const op = tokens[1];
        const b = parseFloat(tokens[2]);
        let res = 0;
        if (op === '+') res = a + b;
        else if (op === '-') res = a - b;
        else if (op === '×' || op === '*') res = a * b;
        else if (op === '÷' || op === '/') res = b !== 0 ? a / b : 0;

        const rounded = Math.round(res * 100) / 100;
        setDisplay(String(rounded));
        setEquation(fullExpression + ' =');
        setIsDone(true);
      }
    } catch {
      setDisplay('Error');
      setIsDone(true);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setModalState({ type: null, data: null })}>
      <div 
        className="modal-dialog" 
        style={{ maxWidth: '340px', padding: '16px', borderRadius: '16px', background: 'var(--bg-surface)' }} 
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '800', fontSize: '15px' }}>
            <CalcIcon size={18} color="var(--accent-blue)" />
            <span>Counter Calculator</span>
          </div>
          <button 
            className="btn btn-secondary btn-sm" 
            style={{ borderRadius: '50%', width: '28px', height: '28px', padding: 0 }}
            onClick={() => setModalState({ type: null, data: null })}
          >
            <X size={15} />
          </button>
        </div>

        {/* Display screen */}
        <div style={{
          background: 'var(--bg-input)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '12px 14px',
          marginBottom: '16px',
          textAlign: 'right'
        }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', minHeight: '18px', fontFamily: 'var(--font-mono)' }}>
            {equation || ' '}
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {display}
          </div>
        </div>

        {/* Keypad */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
          <button className="btn btn-secondary" style={{ padding: '12px', fontSize: '14px', fontWeight: '800', color: 'var(--accent-red)' }} onClick={handleClear}>C</button>
          <button className="btn btn-secondary" style={{ padding: '12px', fontSize: '14px', fontWeight: '800' }} onClick={handleBackspace}><Delete size={16} /></button>
          <button className="btn btn-secondary" style={{ padding: '12px', fontSize: '15px', fontWeight: '800' }} onClick={() => handleOperator('÷')}>÷</button>
          <button className="btn btn-secondary" style={{ padding: '12px', fontSize: '15px', fontWeight: '800' }} onClick={() => handleOperator('×')}>×</button>

          <button className="btn btn-secondary" style={{ padding: '12px', fontSize: '16px', fontWeight: '700' }} onClick={() => handleDigit('7')}>7</button>
          <button className="btn btn-secondary" style={{ padding: '12px', fontSize: '16px', fontWeight: '700' }} onClick={() => handleDigit('8')}>8</button>
          <button className="btn btn-secondary" style={{ padding: '12px', fontSize: '16px', fontWeight: '700' }} onClick={() => handleDigit('9')}>9</button>
          <button className="btn btn-secondary" style={{ padding: '12px', fontSize: '15px', fontWeight: '800' }} onClick={() => handleOperator('-')}>−</button>

          <button className="btn btn-secondary" style={{ padding: '12px', fontSize: '16px', fontWeight: '700' }} onClick={() => handleDigit('4')}>4</button>
          <button className="btn btn-secondary" style={{ padding: '12px', fontSize: '16px', fontWeight: '700' }} onClick={() => handleDigit('5')}>5</button>
          <button className="btn btn-secondary" style={{ padding: '12px', fontSize: '16px', fontWeight: '700' }} onClick={() => handleDigit('6')}>6</button>
          <button className="btn btn-secondary" style={{ padding: '12px', fontSize: '15px', fontWeight: '800' }} onClick={() => handleOperator('+')}>+</button>

          <button className="btn btn-secondary" style={{ padding: '12px', fontSize: '16px', fontWeight: '700' }} onClick={() => handleDigit('1')}>1</button>
          <button className="btn btn-secondary" style={{ padding: '12px', fontSize: '16px', fontWeight: '700' }} onClick={() => handleDigit('2')}>2</button>
          <button className="btn btn-secondary" style={{ padding: '12px', fontSize: '16px', fontWeight: '700' }} onClick={() => handleDigit('3')}>3</button>
          <button 
            className="btn btn-primary" 
            style={{ gridRow: 'span 2', padding: '12px', fontSize: '18px', fontWeight: '800', background: 'linear-gradient(135deg, #0d9488, #0ea5e9)' }} 
            onClick={handleCalculate}
          >
            =
          </button>

          <button className="btn btn-secondary" style={{ gridColumn: 'span 2', padding: '12px', fontSize: '16px', fontWeight: '700' }} onClick={() => handleDigit('0')}>0</button>
          <button className="btn btn-secondary" style={{ padding: '12px', fontSize: '16px', fontWeight: '700' }} onClick={handleDecimal}>.</button>
        </div>
      </div>
    </div>
  );
}
