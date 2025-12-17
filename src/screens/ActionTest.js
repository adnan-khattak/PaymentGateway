import React, { useState, useActionState, useTransition, useOptimistic } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';

// ============================================
// React 19.2 Core Features Demo
// ============================================

// Simulated async API calls
const fakeApiCall = async (data, delay = 1500) => {
  await new Promise(resolve => setTimeout(resolve, delay));
  if (data.name?.toLowerCase() === 'error') {
    throw new Error('Simulated server error!');
  }
  return { success: true, message: `Welcome, ${data.name}!`, timestamp: Date.now() };
};

// ============================================
// 1. useActionState - New in React 19
// Handles async actions with automatic pending state
// ============================================
function ActionStateDemo() {
  const [inputValue, setInputValue] = useState('');

  // useActionState: (action, initialState, permalink?) => [state, dispatch, isPending]
  const [state, submitAction, isPending] = useActionState(
    async (prevState, payload) => {
      try {
        const result = await fakeApiCall({ name: payload });
        return { 
          status: 'success', 
          message: result.message,
          count: prevState.count + 1 
        };
      } catch (error) {
        return { 
          status: 'error', 
          message: error.message,
          count: prevState.count 
        };
      }
    },
    { status: 'idle', message: '', count: 0 }
  );

  const handleSubmit = () => {
    if (inputValue.trim()) {
      submitAction(inputValue);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>1. useActionState Hook</Text>
      <Text style={styles.description}>
        Automatically manages pending states for async actions
      </Text>
      
      <TextInput
        style={styles.input}
        placeholder="Enter your name (type 'error' to test error handling)"
        value={inputValue}
        onChangeText={setInputValue}
        editable={!isPending}
      />
      
      <View style={styles.buttonContainer}>
        <Button
          title={isPending ? 'Submitting...' : 'Submit with Action'}
          onPress={handleSubmit}
          disabled={isPending || !inputValue.trim()}
        />
        {isPending && (
          <ActivityIndicator 
            style={styles.inlineLoader} 
            color="#007AFF" 
            size="small"
          />
        )}
      </View>
      
      <View style={[
        styles.statusBox,
        state.status === 'success' && styles.successBox,
        state.status === 'error' && styles.errorBox,
      ]}>
        <Text style={styles.statusText}>Status: {state.status}</Text>
        <Text style={styles.statusText}>Message: {state.message || 'None'}</Text>
        <Text style={styles.statusText}>Submit Count: {state.count}</Text>
      </View>
    </View>
  );
}

// ============================================
// 2. useOptimistic - New in React 19
// Show optimistic UI updates before server confirms
// ============================================
function OptimisticDemo() {
  const [todos, setTodos] = useState([
    { id: 1, text: 'Learn React 19', completed: false },
    { id: 2, text: 'Try useOptimistic', completed: false },
  ]);
  
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (currentTodos, newTodo) => [
      ...currentTodos,
      { ...newTodo, pending: true }
    ]
  );

  const [newTodoText, setNewTodoText] = useState('');
  const [isAdding, startTransition] = useTransition();

  const addTodo = async () => {
    if (!newTodoText.trim()) return;
    
    const tempTodo = {
      id: Date.now(),
      text: newTodoText,
      completed: false,
    };
    
    setNewTodoText('');
    
    startTransition(async () => {
      // Show optimistic update immediately
      addOptimisticTodo(tempTodo);
      
      // Simulate server delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Actually update the state
      setTodos(prev => [...prev, tempTodo]);
    });
  };

  const toggleTodo = (id) => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>2. useOptimistic Hook</Text>
      <Text style={styles.description}>
        Shows instant UI updates while waiting for server
      </Text>
      
      <View style={styles.todoInputRow}>
        <TextInput
          style={[styles.input, styles.todoInput]}
          placeholder="Add a new todo..."
          value={newTodoText}
          onChangeText={setNewTodoText}
        />
        <Button title="Add" onPress={addTodo} disabled={isAdding} />
      </View>
      
      {optimisticTodos.map(todo => (
        <View 
          key={todo.id} 
          style={[styles.todoItem, todo.pending && styles.pendingTodo]}
        >
          <Text 
            style={[
              styles.todoText,
              todo.completed && styles.completedTodo
            ]}
            onPress={() => !todo.pending && toggleTodo(todo.id)}
          >
            {todo.pending ? '⏳ ' : todo.completed ? '✅ ' : '⬜ '}
            {todo.text}
            {todo.pending && ' (saving...)'}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ============================================
// 3. useTransition with async - Enhanced in React 19
// Now supports async functions directly
// ============================================
function TransitionDemo() {
  const [data, setData] = useState(null);
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState('');

  const fetchData = () => {
    startTransition(async () => {
      // React 19: useTransition now works with async functions!
      await new Promise(resolve => setTimeout(resolve, 1500));
      setData({
        query: query,
        results: [
          `Result 1 for "${query}"`,
          `Result 2 for "${query}"`,
          `Result 3 for "${query}"`,
        ],
        fetchedAt: new Date().toLocaleTimeString(),
      });
    });
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>3. useTransition with Async</Text>
      <Text style={styles.description}>
        React 19 allows async functions in transitions
      </Text>
      
      <TextInput
        style={styles.input}
        placeholder="Search query..."
        value={query}
        onChangeText={setQuery}
        returnKeyType="search"
        onSubmitEditing={fetchData}
        blurOnSubmit={true}
      />
      
      <Button
        title={isPending ? 'Searching...' : 'Search'}
        onPress={fetchData}
        disabled={!query.trim()}
      />
      
      {isPending && (
        <View style={styles.pendingOverlay}>
          <ActivityIndicator color="#007AFF" size="large" />
          <Text style={styles.pendingText}>Loading results...</Text>
        </View>
      )}
      
      {data && !isPending && (
        <View style={styles.resultsBox}>
          <Text style={styles.resultsTitle}>
            Results for "{data.query}" (fetched at {data.fetchedAt})
          </Text>
          {data.results.map((result, index) => (
            <Text key={index} style={styles.resultItem}>• {result}</Text>
          ))}
        </View>
      )}
    </View>
  );
}

// ============================================
// Main Component
// ============================================
export default function ActionsTest() {
  return (
    <ScrollView 
      style={styles.container}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={styles.scrollContent}
    >
      <Text style={styles.header}>⚛️ React 19.2 Features</Text>
      <Text style={styles.subheader}>React Native 0.83.0</Text>
      
      <ActionStateDemo />
      <OptimisticDemo />
      <TransitionDemo />
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          🎉 All features are working with the latest React 19.2!
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
    marginBottom: 20,
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  buttonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  loader: {
    marginTop: 12,
  },
  inlineLoader: {
    marginLeft: 8,
  },
  statusBox: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  successBox: {
    backgroundColor: '#d4edda',
    borderColor: '#28a745',
    borderWidth: 1,
  },
  errorBox: {
    backgroundColor: '#f8d7da',
    borderColor: '#dc3545',
    borderWidth: 1,
  },
  statusText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  todoInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todoInput: {
    flex: 1,
    marginBottom: 0,
  },
  todoItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  pendingTodo: {
    opacity: 0.6,
    backgroundColor: '#fff9e6',
  },
  todoText: {
    fontSize: 16,
    color: '#333',
  },
  completedTodo: {
    textDecorationLine: 'line-through',
    color: '#888',
  },
  pendingOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 12,
    backgroundColor: '#f0f8ff',
    borderRadius: 8,
    marginTop: 16,
  },
  pendingText: {
    color: '#007AFF',
    fontSize: 14,
  },
  resultsBox: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#e8f4fd',
    borderRadius: 8,
  },
  resultsTitle: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  resultItem: {
    fontSize: 14,
    color: '#555',
    paddingVertical: 4,
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