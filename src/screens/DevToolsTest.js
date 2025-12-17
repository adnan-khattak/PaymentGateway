import React, { useState } from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
} from 'react-native';

// ============================================
// React Native 0.83 New Dev Tools Testing
// Network & Performance Monitoring
// ============================================

export default function DevToolsTest() {
  const [networkCalls, setNetworkCalls] = useState(0);
  const [imageLoads, setImageLoads] = useState(0);
  const [heavyComputations, setHeavyComputations] = useState(0);

  // ============================================
  // 1. Network Requests Testing
  // Check these in the Network tab of new DevTools
  // ============================================
  const testFetch = async () => {
    setNetworkCalls(prev => prev + 1);
    try {
      console.log('🌐 Starting fetch request...');
      const response = await fetch('https://jsonplaceholder.typicode.com/posts/1');
      const data = await response.json();
      console.log('✅ Fetch successful:', data.title);
      Alert.alert('Success', `Fetched: ${data.title}`);
    } catch (error) {
      console.error('❌ Fetch failed:', error);
      Alert.alert('Error', error.message);
    }
  };

  const testMultipleFetch = async () => {
    console.log('🌐 Starting multiple fetch requests...');
    setNetworkCalls(prev => prev + 3);
    
    const urls = [
      'https://jsonplaceholder.typicode.com/posts/1',
      'https://jsonplaceholder.typicode.com/users/1',
      'https://jsonplaceholder.typicode.com/comments/1',
    ];

    try {
      const promises = urls.map(url => fetch(url).then(r => r.json()));
      const results = await Promise.all(promises);
      console.log('✅ All fetches completed:', results.length);
      Alert.alert('Success', `Fetched ${results.length} resources`);
    } catch (error) {
      console.error('❌ Fetch failed:', error);
    }
  };

  const testSlowAPI = async () => {
    console.log('🐌 Starting slow API request...');
    setNetworkCalls(prev => prev + 1);
    
    try {
      // This API has intentional delay
      const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
        method: 'GET',
      });
      const data = await response.json();
      console.log('✅ Slow API completed:', data.length, 'posts');
      Alert.alert('Success', `Loaded ${data.length} posts`);
    } catch (error) {
      console.error('❌ API failed:', error);
    }
  };

  const testPostRequest = async () => {
    console.log('📤 Sending POST request...');
    setNetworkCalls(prev => prev + 1);
    
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Testing New DevTools',
          body: 'This is a test from React Native 0.83',
          userId: 1,
        }),
      });
      const data = await response.json();
      console.log('✅ POST successful:', data);
      Alert.alert('Success', 'POST request completed');
    } catch (error) {
      console.error('❌ POST failed:', error);
    }
  };

  // ============================================
  // 2. Performance Testing
  // Check these in the Performance tab
  // ============================================
  const testHeavyComputation = () => {
    console.log('⚙️ Starting heavy computation...');
    setHeavyComputations(prev => prev + 1);
    
    const start = Date.now();
    
    // Heavy computation - will show up in performance metrics
    let result = 0;
    for (let i = 0; i < 10000000; i++) {
      result += Math.sqrt(i);
    }
    
    const duration = Date.now() - start;
    console.log(`✅ Computation completed in ${duration}ms, result: ${result}`);
    Alert.alert('Done', `Computation took ${duration}ms`);
  };

  const testMultipleRenders = () => {
    console.log('🔄 Triggering multiple re-renders...');
    
    // This will cause multiple state updates and re-renders
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        setHeavyComputations(prev => prev + 1);
        console.log(`Re-render ${i + 1}/10`);
      }, i * 100);
    }
  };

  const testImageLoading = () => {
    console.log('🖼️ Testing image loading...');
    setImageLoads(prev => prev + 1);
    Alert.alert('Check DevTools', 'Watch the Network tab for image requests');
  };

  // ============================================
  // 3. Console Logging for DevTools
  // ============================================
  const testConsoleLogs = () => {
    console.log('📝 Regular log message');
    console.info('ℹ️ Info message');
    console.warn('⚠️ Warning message');
    console.error('❌ Error message');
    
    console.group('📦 Grouped Logs');
    console.log('Log inside group 1');
    console.log('Log inside group 2');
    console.groupEnd();
    
    console.table([
      { name: 'React', version: '19.2.0' },
      { name: 'React Native', version: '0.83.0' },
    ]);
    
    Alert.alert('Done', 'Check console for various log types');
  };

  const testErrorBoundary = () => {
    console.error('🚨 Simulated error:', new Error('Test error for DevTools'));
    Alert.alert('Error Logged', 'Check console for error details');
  };

  // ============================================
  // Render
  // ============================================
  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <Text style={styles.header}>🛠️ New DevTools Testing</Text>
      <Text style={styles.subheader}>React Native 0.83.0</Text>
      <Text style={styles.instruction}>
        Open DevTools: Shake device → "Open Dev Menu" → "Open DevTools"
      </Text>

      {/* Statistics */}
      <View style={styles.statsBox}>
        <Text style={styles.statsTitle}>📊 Test Statistics</Text>
        <Text style={styles.statsText}>Network Calls: {networkCalls}</Text>
        <Text style={styles.statsText}>Image Loads: {imageLoads}</Text>
        <Text style={styles.statsText}>Heavy Computations: {heavyComputations}</Text>
      </View>

      {/* Network Testing Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🌐 Network Tab Testing</Text>
        <Text style={styles.description}>
          These will show up in the Network tab with request/response details
        </Text>
        
        <View style={styles.buttonRow}>
          <Button title="Single GET Request" onPress={testFetch} />
        </View>
        
        <View style={styles.buttonRow}>
          <Button title="Multiple Requests" onPress={testMultipleFetch} color="#ff6b6b" />
        </View>
        
        <View style={styles.buttonRow}>
          <Button title="Slow API (100 posts)" onPress={testSlowAPI} color="#4ecdc4" />
        </View>
        
        <View style={styles.buttonRow}>
          <Button title="POST Request" onPress={testPostRequest} color="#95e1d3" />
        </View>

        <View style={styles.buttonRow}>
          <Button title="Load Images" onPress={testImageLoading} color="#f38181" />
        </View>

        {imageLoads > 0 && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: 'https://picsum.photos/200/200?random=1' }}
              style={styles.image}
              onLoad={() => console.log('✅ Image 1 loaded')}
            />
            <Image
              source={{ uri: 'https://picsum.photos/200/200?random=2' }}
              style={styles.image}
              onLoad={() => console.log('✅ Image 2 loaded')}
            />
          </View>
        )}
      </View>

      {/* Performance Testing Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ Performance Tab Testing</Text>
        <Text style={styles.description}>
          Monitor JS thread performance and render times
        </Text>
        
        <View style={styles.buttonRow}>
          <Button 
            title="Heavy Computation" 
            onPress={testHeavyComputation}
            color="#9b59b6"
          />
        </View>
        
        <View style={styles.buttonRow}>
          <Button 
            title="Multiple Re-renders" 
            onPress={testMultipleRenders}
            color="#3498db"
          />
        </View>
      </View>

      {/* Console Testing Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📝 Console Tab Testing</Text>
        <Text style={styles.description}>
          Test different console log types and error tracking
        </Text>
        
        <View style={styles.buttonRow}>
          <Button 
            title="Various Console Logs" 
            onPress={testConsoleLogs}
            color="#e67e22"
          />
        </View>
        
        <View style={styles.buttonRow}>
          <Button 
            title="Log Error" 
            onPress={testErrorBoundary}
            color="#e74c3c"
          />
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>🎯 How to Use:</Text>
        <Text style={styles.infoText}>
          1. Shake your device or press Cmd+D (iOS) / Cmd+M (Android)
        </Text>
        <Text style={styles.infoText}>
          2. Select "Open DevTools" from the dev menu
        </Text>
        <Text style={styles.infoText}>
          3. Click the buttons above to generate activity
        </Text>
        <Text style={styles.infoText}>
          4. Watch the Network, Performance, and Console tabs
        </Text>
        <Text style={styles.infoText}>
          5. Check request timing, response size, and performance metrics
        </Text>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          ✨ New DevTools in React Native 0.83+
        </Text>
      </View>
    </ScrollView>
  );
}

// ============================================
// Styles
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingBottom: 50,
  },
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 50,
    color: '#333',
  },
  subheader: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 10,
  },
  instruction: {
    fontSize: 14,
    textAlign: 'center',
    color: '#007AFF',
    marginBottom: 20,
    paddingHorizontal: 20,
    fontStyle: 'italic',
  },
  statsBox: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 12,
  },
  statsText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 6,
    fontFamily: 'monospace',
  },
  section: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  buttonRow: {
    marginBottom: 12,
  },
  imageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 16,
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  infoBox: {
    backgroundColor: '#e8f4fd',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    paddingLeft: 8,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#28a745',
    fontWeight: '500',
  },
});
