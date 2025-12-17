// src/TaskManager.js
import { useState, useActionState } from 'react';
import { View, Text, TextInput, Button, FlatList, TouchableOpacity } from 'react-native';

export default function TaskManager() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all'); // all, active, completed

  async function addTaskAction(prevState, formData) {
    const title = formData.get('title');
    if (!title) return { error: 'Title required' };

    const tempTask = {
      id: Date.now(),
      title,
      completed: false,
      synced: false
    };

    setTasks([...tasks, tempTask]);

    try {
      // Watch this in Network tab - try offline mode!
      const response = await fetch('https://jsonplaceholder.typicode.com/todos', {
        method: 'POST',
        body: JSON.stringify({ title, completed: false }),
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const serverTask = await response.json();
        setTasks(tasks.map(t => 
          t.id === tempTask.id ? { ...t, id: serverTask.id, synced: true } : t
        ));
        return { success: true };
      }
    } catch (error) {
      // Task stays in queue with synced: false
      return { error: 'Offline - will sync later' };
    }
  }

  const [state, addTask, isPending] = useActionState(addTaskAction, {});

  const toggleTask = async (id) => {
    setTasks(tasks.map(t => 
      t.id === id ? { ...t, completed: !t.completed } : t
    ));

    await fetch(`https://jsonplaceholder.typicode.com/todos/${id}`, {
      method: 'PATCH'
    });
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Task Manager</Text>
      
      <View style={{ flexDirection: 'row', marginBottom: 20 }}>
        <TextInput
          placeholder="New task..."
          name="title"
          style={{ flex: 1, borderWidth: 1, padding: 10, marginRight: 10 }}
        />
        <Button 
          title={isPending ? '...' : 'Add'}
          onPress={addTask}
        />
      </View>

      {state.error && <Text style={{ color: 'red' }}>{state.error}</Text>}

      <View style={{ flexDirection: 'row', marginBottom: 10 }}>
        {['all', 'active', 'completed'].map(f => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={{ 
              padding: 10, 
              backgroundColor: filter === f ? '#007AFF' : '#e0e0e0',
              marginRight: 5,
              borderRadius: 5
            }}
          >
            <Text style={{ color: filter === f ? 'white' : 'black' }}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredTasks}
        renderItem={({ item }) => (
          <View style={{ 
            flexDirection: 'row', 
            padding: 15, 
            borderBottomWidth: 1,
            alignItems: 'center'
          }}>
            <TouchableOpacity onPress={() => toggleTask(item.id)}>
              <Text style={{ fontSize: 24, marginRight: 10 }}>
                {item.completed ? '✅' : '⬜'}
              </Text>
            </TouchableOpacity>
            <Text style={{ 
              flex: 1, 
              textDecorationLine: item.completed ? 'line-through' : 'none'
            }}>
              {item.title}
            </Text>
            {!item.synced && <Text style={{ color: 'orange' }}>⏱️</Text>}
            <TouchableOpacity onPress={() => deleteTask(item.id)}>
              <Text style={{ color: 'red', marginLeft: 10 }}>🗑️</Text>
            </TouchableOpacity>
          </View>
        )}
        keyExtractor={item => item.id.toString()}
      />
    </View>
  );
}