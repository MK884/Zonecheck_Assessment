import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';


const TasksScreen = () => {
  const { user, signOut } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        Alert.alert('Error', `Failed to fetch tasks: ${error.message}`);
        return;
      }

      setTasks(data || []);
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred while fetching tasks');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  };

  const addTask = async () => {
    if (!newTask.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([
          {
            task_title: newTask.trim(),
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) {
        Alert.alert('Error', `Failed to add task: ${error.message}`);
        return;
      }

      setTasks(prevTasks => [data, ...prevTasks]);
      setNewTask('');
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred while adding task');
    }
  };

  const updateTask = async (taskId, newTitle) => {
    if (!newTitle.trim()) {
      Alert.alert('Error', 'Task title cannot be empty');
      return;
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ task_title: newTitle.trim() })
        .eq('id', taskId);

      if (error) {
        Alert.alert('Error', `Failed to update task: ${error.message}`);
        return;
      }

      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? { ...task, task_title: newTitle.trim() } : task
        )
      );
      setEditingTask(null);
      setEditText('');
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred while updating task');
    }
  };

  const deleteTask = async (taskId) => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', taskId);

              if (error) {
                Alert.alert('Error', `Failed to delete task: ${error.message}`);
                return;
              }

              setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
            } catch (error) {
              Alert.alert('Error', 'An unexpected error occurred while deleting task');
            }
          },
        },
      ]
    );
  };

  const startEditing = (task) => {
    setEditingTask(task.id);
    setEditText(task.task_title);
  };

  const cancelEditing = () => {
    setEditingTask(null);
    setEditText('');
  };

  const renderTask = ({ item }) => (
    <View style={styles.taskItem}>
      {editingTask === item.id ? (
        <View style={styles.editContainer}>
          <TextInput
            style={styles.editInput}
            value={editText}
            onChangeText={setEditText}
            multiline
          />
          <View style={styles.editButtons}>
            <TouchableOpacity
              style={[styles.editButton, styles.saveButton]}
              onPress={() => updateTask(item.id, editText)}
            >
              <Text style={styles.editButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.editButton, styles.cancelButton]}
              onPress={cancelEditing}
            >
              <Text style={styles.editButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <>
          <Text style={styles.taskTitle}>{item.task_title}</Text>
          <Text style={styles.taskDate}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
          <View style={styles.taskButtons}>
            <TouchableOpacity
              style={[styles.taskButton, styles.editTaskButton]}
              onPress={() => startEditing(item)}
            >
              <Text style={styles.taskButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.taskButton, styles.deleteButton]}
              onPress={() => deleteTask(item.id)}
            >
              <Text style={styles.taskButtonText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Tasks</Text>
        <TouchableOpacity onPress={signOut} style={styles.signOutButton}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter new task..."
          value={newTask}
          onChangeText={setNewTask}
          multiline
        />
        <TouchableOpacity style={styles.addButton} onPress={addTask}>
          <Text style={styles.addButtonText}>Add Task</Text>
        </TouchableOpacity>
      </View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={tasks}
          renderItem={renderTask}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.tasksList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No tasks yet. Add one above!</Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#007AFF',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  signOutButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
  },
  signOutText: {
    color: 'white',
    fontSize: 14,
  },
  inputContainer: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
    minHeight: 50,
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tasksList: {
    padding: 20,
  },
  taskItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  taskDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  taskButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  taskButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editTaskButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  taskButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  editContainer: {
    gap: 10,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
    minHeight: 40,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  editButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#757575',
  },
  editButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});

export default TasksScreen;