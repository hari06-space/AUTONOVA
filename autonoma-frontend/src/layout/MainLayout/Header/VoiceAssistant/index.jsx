import { useState, useEffect } from 'react';

// material-ui
import { useTheme, styled } from '@mui/material/styles';
import { Avatar, Box, IconButton, Tooltip, Typography, keyframes } from '@mui/material';

// project imports
import { useDispatch } from 'react-redux';
import { setQuery } from 'store/slices/search';
import { openSnackbar } from 'store/slices/snackbar';

// assets
import { IconMicrophone } from '@tabler/icons-react';
import VoiceWaveform from 'ui-component/ai/VoiceWaveform';

const pulse = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.4); }
  70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(244, 67, 54, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(244, 67, 54, 0); }
`;

const ListeningAvatar = styled(Avatar)(({ theme, listening }) => ({
  ...theme.typography.commonAvatar,
  ...theme.typography.mediumAvatar,
  cursor: 'pointer',
  transition: 'all .2s ease-in-out',
  background: listening ? theme.palette.error.main : theme.palette.primary.light,
  color: listening ? theme.palette.error.contrastText : theme.palette.primary.dark,
  animation: listening ? `${pulse} 1.5s infinite` : 'none',
  '&:hover': {
    background: listening ? theme.palette.error.dark : theme.palette.primary.dark,
    color: listening ? theme.palette.error.contrastText : theme.palette.primary.light
  }
}));

const VoiceAssistant = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = 'en-US';

      recog.onstart = () => {
        setIsListening(true);
      };

      recog.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        dispatch(setQuery(transcript));
        setIsListening(false);
      };

      recog.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recog.onend = () => {
        setIsListening(false);
      };

      setRecognition(recog);
    }
  }, [dispatch]);

  const toggleListening = () => {
    if (isListening) {
      recognition.stop();
    } else {
      if (recognition) {
        recognition.start();
      } else {
        dispatch(openSnackbar({ open: true, message: 'Speech recognition is not supported in this browser.', variant: 'alert', alert: { color: 'warning' } }));
      }
    }
  };

  return (
    <Box sx={{ ml: 2, mr: 1, display: 'flex', alignItems: 'center' }}>
      <Tooltip title={isListening ? 'Listening...' : 'Voice Search'}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isListening && <VoiceWaveform color="error.main" />}
          <ListeningAvatar listening={isListening ? 1 : 0} onClick={toggleListening} variant="rounded">
            <IconMicrophone stroke={1.5} size="20px" />
          </ListeningAvatar>
        </Box>
      </Tooltip>
      <style>
        {`
          @keyframes blink {
            0% { opacity: 1; }
            50% { opacity: 0.3; }
            100% { opacity: 1; }
          }
        `}
      </style>
    </Box>
  );
};

export default VoiceAssistant;
