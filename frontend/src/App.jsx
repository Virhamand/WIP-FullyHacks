import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import HomeScreen from './screens/HomeScreen';
import CreateRoomScreen from './screens/CreateRoomScreen';
import JoinRoomScreen from './screens/JoinRoomScreen';
import LobbyScreen from './screens/LobbyScreen';
import QuestionScreen from './screens/QuestionScreen';
import RevealScreen from './screens/RevealScreen';
import RoundEndScreen from './screens/RoundEndScreen';
import VotingScreen from './screens/VotingScreen';
import GameOverScreen from './screens/GameOverScreen';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export default function App() {
  const [socket, setSocket] = useState(null);
  const [screen, setScreen] = useState('home');
  const [toast, setToast] = useState('');

  // Game state
  const [gameState, setGameState] = useState({
    roomCode: null,
    playerId: null,
    playerName: null,
    players: [],
    isHost: false,
    round: 0,
    question: null,
    answers: [],
    labelMap: [],
    revealMap: [],
    selectedLabel: null,
    selectedVoteId: null,
    timeLeft: 0,
  });

  // Initialize socket
  useEffect(() => {
    const newSocket = io(SERVER_URL);
    setSocket(newSocket);

    return () => newSocket.disconnect();
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    socket.on('room_created', ({ roomCode, playerId }) => {
      setGameState(prev => ({
        ...prev,
        roomCode,
        playerId,
        isHost: true,
      }));
      setScreen('lobby');
    });

    socket.on('join_failed', ({ reason }) => {
      const msgs = {
        not_found: 'Room not found.',
        full: 'Room is full.',
        in_progress: 'Game already started.',
      };
      showToast(msgs[reason] || 'Could not join.');
    });

    socket.on('lobby_update', ({ players, ready }) => {
      setGameState(prev => ({ ...prev, players }));
      if (ready && gameState.isHost) {
        // Enable start button
      }
    });

    socket.on('round_start', ({ round, question, timeLimit }) => {
      setGameState(prev => ({
        ...prev,
        round,
        question,
        answers: [],
        selectedLabel: null,
      }));
      setScreen('question');
    });

    socket.on('answers_reveal', ({ answers }) => {
      setGameState(prev => ({
        ...prev,
        labelMap: answers,
        selectedLabel: null,
      }));
      setScreen('reveal');
    });

    socket.on('pointing_update', ({ points }) => {
      // Live update of who's pointing at what
      setGameState(prev => ({ ...prev, points }));
    });

    socket.on('round_end', ({ reveal, nextState }) => {
      setGameState(prev => ({ ...prev, revealMap: reveal }));
      setScreen('round-end');
    });

    socket.on('voting_start', ({ timeLimit }) => {
      setGameState(prev => ({ ...prev, selectedVoteId: null }));
      setScreen('voting');
    });

    socket.on('game_over', ({ winner, aiPlayerId, votes }) => {
      setGameState(prev => ({
        ...prev,
        winner,
        aiPlayerId,
        votes,
      }));
      setScreen('gameover');
    });

    socket.on('player_disconnected', ({ name }) => {
      showToast(`${name} disconnected.`);
    });

    socket.on('error', ({ message }) => {
      showToast(message);
    });
  }, [socket]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleCreateRoom = (playerName) => {
    setGameState(prev => ({ ...prev, playerName }));
    socket.emit('create_room', { playerName });
  };

  const handleJoinRoom = (playerName, roomCode) => {
    setGameState(prev => ({ ...prev, playerName }));
    socket.emit('join_room', { roomCode, playerName });
  };

  const handleStartGame = () => {
    socket.emit('start_game', { roomCode: gameState.roomCode });
  };

  const handleSubmitAnswer = (text) => {
    socket.emit('submit_answer', { roomCode: gameState.roomCode, text });
  };

  const handleSubmitPoint = (suspectLabel) => {
    socket.emit('submit_point', { roomCode: gameState.roomCode, suspectLabel });
    setGameState(prev => ({ ...prev, selectedLabel: suspectLabel }));
  };

  const handleSubmitVote = (suspectId) => {
    socket.emit('submit_vote', { roomCode: gameState.roomCode, suspectId });
    setGameState(prev => ({ ...prev, selectedVoteId: suspectId }));
  };

  const handlePlayAgain = () => {
    setGameState({
      roomCode: null,
      playerId: null,
      playerName: null,
      players: [],
      isHost: false,
      round: 0,
      question: null,
      answers: [],
      labelMap: [],
      revealMap: [],
      selectedLabel: null,
      selectedVoteId: null,
      timeLeft: 0,
    });
    setScreen('home');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Background noise */}
      <div className="fixed inset-0 opacity-5 pointer-events-none mix-blend-overlay" 
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\"0 0 256 256\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cfilter id=\"n\"%3E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.9\" numOctaves=\"4\" stitchTiles=\"stitch\"/%3E%3C/filter%3E%3Crect width=\"100%25\" height=\"100%25\" filter=\"url(%23n)\" opacity=\"0.04\"/%3E%3C/svg%3E")',
        }}
      />

      {/* Screen routing */}
      {screen === 'home' && <HomeScreen onNavigate={setScreen} />}
      {screen === 'create' && <CreateRoomScreen onCreate={handleCreateRoom} onBack={() => setScreen('home')} />}
      {screen === 'join' && <JoinRoomScreen onJoin={handleJoinRoom} onBack={() => setScreen('home')} />}
      {screen === 'lobby' && (
        <LobbyScreen
          roomCode={gameState.roomCode}
          players={gameState.players}
          isHost={gameState.isHost}
          onStart={handleStartGame}
        />
      )}
      {screen === 'question' && (
        <QuestionScreen
          round={gameState.round}
          question={gameState.question}
          onSubmit={handleSubmitAnswer}
        />
      )}
      {screen === 'reveal' && (
        <RevealScreen
          round={gameState.round}
          answers={gameState.labelMap}
          selectedLabel={gameState.selectedLabel}
          onSelect={handleSubmitPoint}
        />
      )}
      {screen === 'round-end' && (
        <RoundEndScreen
          reveal={gameState.revealMap}
          round={gameState.round}
        />
      )}
      {screen === 'voting' && (
        <VotingScreen
          players={gameState.players}
          selectedVoteId={gameState.selectedVoteId}
          onVote={handleSubmitVote}
        />
      )}
      {screen === 'gameover' && (
        <GameOverScreen
          winner={gameState.winner}
          aiPlayerId={gameState.aiPlayerId}
          players={gameState.players}
          votes={gameState.votes}
          onPlayAgain={handlePlayAgain}
        />
      )}

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-700 px-6 py-3 rounded-lg text-sm font-mono border border-slate-600">
          {toast}
        </div>
      )}
    </div>
  );
}
