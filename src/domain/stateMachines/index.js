/**
 * @file index.js
 * @module domain/stateMachines
 * @description Ponto único de entrada (Facade) para todas as máquinas de estado explícitas do Rhyme.
 * Em conformidade com a ISO/IEC/IEEE 12207:2017 (6.4.7 - Software Construction / Domain Modeling).
 */

export * from './tripStateMachine';
export * from './attendanceStateMachine';
export * from './telemetryStateMachine';
export * from './boardingCallStateMachine';
export * from './wakeUpAlarmStateMachine';
