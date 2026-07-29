import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:audioplayers/audioplayers.dart';
import 'package:record/record.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:file_picker/file_picker.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const EarProApp());
}

class LocalTrack {
  final String id;
  final String title;
  final String artist;
  final String path;
  final bool isVideo;

  LocalTrack({
    required this.id,
    required this.title,
    required this.artist,
    required this.path,
    this.isVideo = false,
  });
}

class EarProApp extends StatelessWidget {
  const EarProApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Earpro Smart Music Player',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark(useMaterial3: true).copyWith(
        scaffoldBackgroundColor: const Color(0xFF121212),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF1DB954),
          brightness: Brightness.dark,
        ),
      ),
      home: const MainTabScreen(),
    );
  }
}

class MainTabScreen extends StatefulWidget {
  const MainTabScreen({super.key});

  @override
  State<MainTabScreen> createState() => _MainTabScreenState();
}

class _MainTabScreenState extends State<MainTabScreen> {
  int _currentIndex = 0;

  // Audio Player
  final AudioPlayer _audioPlayer = AudioPlayer();

  // Playlist of Local & Stream Tracks
  final List<LocalTrack> _playlist = [
    LocalTrack(
      id: 'default-1',
      title: 'Acoustic Melody (Sample)',
      artist: 'SoundHelix Stream',
      path: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    ),
  ];

  int _currentTrackIndex = 0;
  bool _isPlaying = false;
  Duration _duration = Duration.zero;
  Duration _position = Duration.zero;

  // Microphone & Voice Detection
  final AudioRecorder _audioRecorder = AudioRecorder();
  Timer? _amplitudeTimer;
  Timer? _silenceTimer;

  bool _isSmartVoiceEnabled = true;
  bool _isVoiceDetected = false;
  bool _isPausedByVoice = false;

  double _currentDb = -100.0;
  final double _thresholdDb = -22.0; // High precision speech threshold (-22 dB prevents ambient chatter false triggers)
  int _silenceRemainingSeconds = 5;
  String _statusMessage = 'Ready to play';

  @override
  void initState() {
    super.initState();
    _initAudioPlayer();
    _initMicrophone();
  }

  void _initAudioPlayer() {
    _audioPlayer.onPlayerStateChanged.listen((state) {
      if (mounted) {
        setState(() {
          _isPlaying = state == PlayerState.playing;
        });
      }
    });

    _audioPlayer.onDurationChanged.listen((d) {
      if (mounted) setState(() => _duration = d);
    });

    _audioPlayer.onPositionChanged.listen((p) {
      if (mounted) setState(() => _position = p);
    });

    _audioPlayer.onPlayerComplete.listen((_) {
      _playNext();
    });
  }

  Future<void> _initMicrophone() async {
    final status = await Permission.microphone.request();
    if (status != PermissionStatus.granted) {
      if (mounted) setState(() => _statusMessage = 'Microphone permission denied');
      return;
    }

    try {
      final hasPermission = await _audioRecorder.hasPermission();
      if (hasPermission) {
        await _audioRecorder.start(
          const RecordConfig(encoder: AudioEncoder.aacLc),
          path: '',
        );
        _startAmplitudeMonitoring();
      }
    } catch (e) {
      debugPrint('Microphone error: $e');
    }
  }

  void _startAmplitudeMonitoring() {
    _amplitudeTimer?.cancel();
    _amplitudeTimer = Timer.periodic(const Duration(milliseconds: 100), (_) async {
      if (!_isSmartVoiceEnabled) return;

      final amp = await _audioRecorder.getAmplitude();
      final currentDb = amp.current;

      if (mounted) setState(() => _currentDb = currentDb);

      if (currentDb > _thresholdDb) {
        _onSpeechDetected();
      } else if (_isPausedByVoice && _isVoiceDetected) {
        _onSilenceStart();
      }
    });
  }

  void _onSpeechDetected() {
    _silenceTimer?.cancel();

    if (!_isVoiceDetected) {
      if (mounted) {
        setState(() {
          _isVoiceDetected = true;
          _isPausedByVoice = true;
          _silenceRemainingSeconds = 10;
          _statusMessage = '🗣️ Speech Detected — Audio Paused';
        });
      }
      if (_isPlaying) {
        _audioPlayer.pause();
      }
    } else {
      if (mounted) {
        setState(() {
          _silenceRemainingSeconds = 10;
          _statusMessage = '🗣️ Speaking... (10s Silence Reset)';
        });
      }
    }
  }

  void _onSilenceStart() {
    _isVoiceDetected = false;
    if (_silenceTimer != null && _silenceTimer!.isActive) return;

    _silenceTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return;

      if (_silenceRemainingSeconds > 1) {
        setState(() {
          _silenceRemainingSeconds--;
          _statusMessage = '🤫 Silence Detected — Resuming in ${_silenceRemainingSeconds}s';
        });
      } else {
        timer.cancel();
        setState(() {
          _isPausedByVoice = false;
          _statusMessage = '▶️ Resuming Playback after 10s Silence';
        });
        _playTrack(_currentTrackIndex);
      }
    });
  }

  Future<void> _playTrack(int index) async {
    if (index < 0 || index >= _playlist.length) return;
    _currentTrackIndex = index;
    _isPausedByVoice = false;
    _silenceTimer?.cancel();

    final track = _playlist[index];
    Source source;

    if (track.path.startsWith('http://') || track.path.startsWith('https://')) {
      source = UrlSource(track.path);
    } else {
      source = DeviceFileSource(track.path);
    }

    await _audioPlayer.play(source);
    if (mounted) {
      setState(() {
        _statusMessage = 'Playing: ${track.title}';
      });
    }
  }

  Future<void> _pauseAudio() async {
    _silenceTimer?.cancel();
    await _audioPlayer.pause();
    if (mounted) setState(() => _statusMessage = 'Paused');
  }

  void _playNext() {
    if (_playlist.isEmpty) return;
    final nextIndex = (_currentTrackIndex + 1) % _playlist.length;
    _playTrack(nextIndex);
  }

  void _playPrev() {
    if (_playlist.isEmpty) return;
    final prevIndex = (_currentTrackIndex - 1 + _playlist.length) % _playlist.length;
    _playTrack(prevIndex);
  }

  // Scan local phone storage for audio and video files directly
  Future<void> _scanOfflineMediaFiles() async {
    await Permission.storage.request();
    await Permission.audio.request();

    try {
      final result = await FilePicker.platform.pickFiles(
        allowMultiple: true,
        type: FileType.custom,
        allowedExtensions: ['mp3', 'wav', 'm4a', 'aac', 'flac', 'mp4', 'mkv', 'webm', 'mov', 'avi', '3gp'],
      );

      if (result != null && result.files.isNotEmpty) {
        final newTracks = <LocalTrack>[];

        for (var file in result.files) {
          if (file.path != null) {
            final ext = file.extension?.toLowerCase() ?? '';
            final isVideo = ['mp4', 'mkv', 'webm', 'mov', 'avi', '3gp'].contains(ext);

            newTracks.add(LocalTrack(
              id: 'local-${DateTime.now().millisecondsSinceEpoch}-${file.name}',
              title: file.name.replaceAll('.$ext', ''),
              artist: isVideo ? 'Offline Video MP3 Stream' : 'Local Offline Song',
              path: file.path!,
              isVideo: isVideo,
            ));
          }
        }

        setState(() {
          _playlist.insertAll(0, newTracks);
          _currentTrackIndex = 0;
        });

        _playTrack(0);

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Added ${newTracks.length} local audio/video songs to playlist!'),
              backgroundColor: const Color(0xFF1DB954),
            ),
          );
        }
      }
    } catch (e) {
      debugPrint('File picker error: $e');
    }
  }

  @override
  void dispose() {
    _amplitudeTimer?.cancel();
    _silenceTimer?.cancel();
    _audioPlayer.dispose();
    _audioRecorder.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final currentTrack = _playlist[_currentTrackIndex];
    final normalizedVolume = ((_currentDb + 60) / 60).clamp(0.0, 1.0);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: const [
            Icon(Icons.mic, color: Color(0xFF1DB954)),
            SizedBox(width: 8),
            Text('Earpro', style: TextStyle(fontWeight: FontWeight.bold)),
            SizedBox(width: 6),
            Chip(
              label: Text('OFFLINE PLAYER', style: TextStyle(fontSize: 10, color: Color(0xFF1DB954))),
              backgroundColor: Color(0x221DB954),
              padding: EdgeInsets.zero,
              visualDensity: VisualDensity.compact,
            ),
          ],
        ),
        backgroundColor: const Color(0xFF181818),
        elevation: 0,
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: [
          // TAB 0: PLAYER
          _buildPlayerTab(currentTrack, normalizedVolume),
          // TAB 1: OFFLINE LOCAL SONGS LIST
          _buildOfflineSongsTab(),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        selectedItemColor: const Color(0xFF1DB954),
        unselectedItemColor: Colors.grey,
        backgroundColor: const Color(0xFF181818),
        onTap: (index) {
          setState(() => _currentIndex = index);
          if (index == 1 && _playlist.length <= 1) {
            _scanOfflineMediaFiles();
          }
        },
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.music_note), label: 'Player'),
          BottomNavigationBarItem(icon: Icon(Icons.folder_special), label: 'Offline Music'),
        ],
      ),
    );
  }

  Widget _buildPlayerTab(LocalTrack currentTrack, double normalizedVolume) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Album Art Card
          Container(
            height: 240,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              gradient: const LinearGradient(
                colors: [Color(0xFF1DB954), Color(0xFF121212)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              boxShadow: const [
                BoxShadow(color: Colors.black54, blurRadius: 15, offset: Offset(0, 8))
              ],
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                Icon(
                  _isPausedByVoice
                      ? Icons.mic
                      : (currentTrack.isVideo ? Icons.video_library : Icons.music_note),
                  size: 80,
                  color: Colors.white.withOpacity(0.8),
                ),
                if (_isPausedByVoice)
                  Positioned(
                    bottom: 20,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.black80,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: const Color(0xFF1DB954)),
                      ),
                      child: Text(
                        'Countdown: ${_silenceRemainingSeconds}s',
                        style: const TextStyle(
                          color: Color(0xFF1DB954),
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          Text(
            currentTrack.title,
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 4),
          Text(
            currentTrack.artist,
            style: const TextStyle(fontSize: 14, color: Colors.grey),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),

          // Live Voice Status Card
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: const Color(0xFF181818),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: _isPausedByVoice ? const Color(0xFF1DB954) : Colors.white12,
              ),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      _statusMessage,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: _isPausedByVoice ? const Color(0xFF1DB954) : Colors.white70,
                      ),
                    ),
                    Text(
                      '${_currentDb.toStringAsFixed(1)} dB',
                      style: const TextStyle(fontSize: 11, fontFamily: 'monospace', color: Colors.grey),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                LinearProgressIndicator(
                  value: normalizedVolume,
                  minHeight: 6,
                  backgroundColor: Colors.grey.shade900,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    _currentDb > _thresholdDb ? const Color(0xFF1DB954) : Colors.grey.shade700,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),

          // Auto Pause Switch
          SwitchListTile(
            activeColor: const Color(0xFF1DB954),
            title: const Text('Auto-Pause on Speech', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
            subtitle: const Text('Pauses when speaking & resumes after 10s silence', style: TextStyle(fontSize: 12, color: Colors.grey)),
            value: _isSmartVoiceEnabled,
            onChanged: (val) {
              setState(() {
                _isSmartVoiceEnabled = val;
                if (!val) {
                  _isPausedByVoice = false;
                  _silenceTimer?.cancel();
                }
              });
            },
          ),
          const SizedBox(height: 12),

          // Progress Slider
          Slider(
            activeColor: const Color(0xFF1DB954),
            inactiveColor: Colors.grey.shade800,
            value: _position.inSeconds.toDouble().clamp(
                  0.0,
                  _duration.inSeconds.toDouble() > 0 ? _duration.inSeconds.toDouble() : 1.0,
                ),
            max: _duration.inSeconds.toDouble() > 0 ? _duration.inSeconds.toDouble() : 1.0,
            onChanged: (val) {
              _audioPlayer.seek(Duration(seconds: val.toInt()));
            },
          ),

          // Controls
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              IconButton(icon: const Icon(Icons.skip_previous), onPressed: _playPrev),
              const SizedBox(width: 16),
              FloatingActionButton(
                backgroundColor: const Color(0xFF1DB954),
                foregroundColor: Colors.black,
                onPressed: () {
                  if (_isPlaying) {
                    _pauseAudio();
                  } else {
                    _playTrack(_currentTrackIndex);
                  }
                },
                child: Icon(_isPlaying ? Icons.pause : Icons.play_arrow),
              ),
              const SizedBox(width: 16),
              IconButton(icon: const Icon(Icons.skip_next), onPressed: _playNext),
            ],
          ),
        ],
      ),
    );
  }

  String _searchQuery = '';

  Widget _buildOfflineSongsTab() {
    final filteredPlaylist = _playlist.where((track) {
      if (_searchQuery.trim().isEmpty) return true;
      final q = _searchQuery.toLowerCase();
      return track.title.toLowerCase().contains(q) || track.artist.toLowerCase().contains(q);
    }).toList();

    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1DB954),
              foregroundColor: Colors.black,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
            icon: const Icon(Icons.folder_open),
            label: const Text(
              'Scan Offline Phone Songs & Videos',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            onPressed: _scanOfflineMediaFiles,
          ),
          const SizedBox(height: 12),

          // Spotify style Search bar at top
          TextField(
            onChanged: (val) {
              setState(() {
                _searchQuery = val;
              });
            },
            style: const TextStyle(color: Colors.white, fontSize: 13),
            decoration: InputDecoration(
              hintText: 'Search in offline songs...',
              hintStyle: const TextStyle(color: Colors.grey, fontSize: 13),
              prefixIcon: const Icon(Icons.search, color: Colors.grey, size: 20),
              suffixIcon: _searchQuery.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear, color: Colors.grey, size: 18),
                      onPressed: () => setState(() => _searchQuery = ''),
                    )
                  : null,
              filled: true,
              fillColor: const Color(0xFF181818),
              contentPadding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
            ),
          ),
          const SizedBox(height: 12),

          const Text(
            'Your Offline Tracks',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),

          Expanded(
            child: filteredPlaylist.isEmpty
                ? const Center(
                    child: Text(
                      'No matching tracks found',
                      style: TextStyle(color: Colors.grey),
                    ),
                  )
                : ListView.builder(
                    itemCount: filteredPlaylist.length,
                    itemBuilder: (context, index) {
                      final track = filteredPlaylist[index];
                      final originalIndex = _playlist.indexOf(track);
                      final isSelected = originalIndex == _currentTrackIndex;

                      return Card(
                        color: isSelected ? const Color(0x331DB954) : const Color(0xFF181818),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        child: ListTile(
                          leading: Icon(
                            track.isVideo ? Icons.movie : Icons.music_note,
                            color: isSelected ? const Color(0xFF1DB954) : Colors.grey,
                          ),
                          title: Text(
                            track.title,
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: isSelected ? const Color(0xFF1DB954) : Colors.white,
                            ),
                          ),
                          subtitle: Text(track.artist, style: const TextStyle(fontSize: 12, color: Colors.grey)),
                          trailing: isSelected && _isPlaying
                              ? const Icon(Icons.volume_up, color: Color(0xFF1DB954))
                              : null,
                          onTap: () {
                            _playTrack(originalIndex);
                            setState(() => _currentIndex = 0); // Switch to player tab
                          },
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
