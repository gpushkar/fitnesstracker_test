
// Register Service Worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(reg => console.log('Service Worker registered'))
        .catch(err => console.log('Service Worker registration failed'));
}

// Exercise database
const exercises = {
    upper: [
        'Bench Press',
        'Shoulder Press',
        'Bent Over Row',
        'Pull-ups',
        'Bicep Curls',
        'Tricep Dips'
    ],
    lower: [
        'Squats',
        'Deadlifts',
        'Leg Press',
        'Lunges',
        'Leg Curls',
        'Calf Raises'
    ],
    core: [
        'Planks (seconds)',
        'Crunches',
        'Russian Twists',
        'Leg Raises',
        'Mountain Climbers',
        'Dead Bug'
    ]
};

// State
let currentWorkoutType = null;
let workoutData = {};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    setupWorkoutButtons();
    setupSaveButton();
    loadHistory();
});

// Tab switching
function setupTabs() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.dataset.tab;
            
            // Update active tab
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update active content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${tabName}-tab`).classList.add('active');
            
            if (tabName === 'history') {
                loadHistory();
            }
        });
    });
}

// Workout type selection
function setupWorkoutButtons() {
    const buttons = document.querySelectorAll('.workout-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            startWorkout(type);
        });
    });
}

// Start workout
function startWorkout(type) {
    currentWorkoutType = type;
    workoutData = {};
    
    const exerciseList = document.getElementById('exercise-list');
    const exercisesContainer = document.getElementById('exercises');
    const title = document.getElementById('workout-title');
    
    title.textContent = `${type.charAt(0).toUpperCase() + type.slice(1)} Body Workout`;
    exercisesContainer.innerHTML = '';
    
    exercises[type].forEach(exercise => {
        const avg = getAverageForExercise(exercise);
        const exerciseDiv = document.createElement('div');
        exerciseDiv.className = 'exercise-item';
        exerciseDiv.innerHTML = `
            <h4>${exercise}</h4>
            ${avg ? `<div class="exercise-avg">Average: ${avg.weight}kg × ${avg.reps} reps</div>` : ''}
            <div class="input-group">
                <input type="number" placeholder="Weight (kg)" data-exercise="${exercise}" data-field="weight">
                <input type="number" placeholder="Reps" data-exercise="${exercise}" data-field="reps">
            </div>
        `;
        exercisesContainer.appendChild(exerciseDiv);
    });
    
    exerciseList.classList.remove('hidden');
}

// Get average for exercise
function getAverageForExercise(exercise) {
    const history = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
    const exerciseHistory = history
        .flatMap(workout => workout.exercises)
        .filter(e => e.name === exercise && e.weight && e.reps);
    
    if (exerciseHistory.length === 0) return null;
    
    const avgWeight = exerciseHistory.reduce((sum, e) => sum + e.weight, 0) / exerciseHistory.length;
    const avgReps = exerciseHistory.reduce((sum, e) => sum + e.reps, 0) / exerciseHistory.length;
    
    return {
        weight: avgWeight.toFixed(1),
        reps: Math.round(avgReps)
    };
}

// Save workout
function setupSaveButton() {
    document.getElementById('save-workout').addEventListener('click', () => {
        const inputs = document.querySelectorAll('#exercises input');
        const exercises = [];
        
        inputs.forEach(input => {
            const exercise = input.dataset.exercise;
            const field = input.dataset.field;
            const value = parseFloat(input.value);
            
            if (!workoutData[exercise]) {
                workoutData[exercise] = {};
            }
            workoutData[exercise][field] = value || 0;
        });
        
        // Convert to array
        Object.keys(workoutData).forEach(name => {
            exercises.push({
                name,
                weight: workoutData[name].weight || 0,
                reps: workoutData[name].reps || 0
            });
        });
        
        // Save to localStorage
        const history = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
        history.unshift({
            date: new Date().toISOString(),
            type: currentWorkoutType,
            exercises
        });
        localStorage.setItem('workoutHistory', JSON.stringify(history));
        
        alert('Workout saved!');
        document.getElementById('exercise-list').classList.add('hidden');
    });
}

// Load history
function loadHistory() {
    const historyList = document.getElementById('history-list');
    const history = JSON.parse(localStorage.getItem('workoutHistory') || '[]');
    
    if (history.length === 0) {
        historyList.innerHTML = '<div class="empty-state">No workouts yet. Start your first workout!</div>';
        return;
    }
    
    historyList.innerHTML = history.map(workout => {
        const date = new Date(workout.date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const exerciseList = workout.exercises
            .filter(e => e.weight > 0 || e.reps > 0)
            .map(e => `${e.name}: ${e.weight}kg × ${e.reps} reps`)
            .join('<br>');
        
        return `
            <div class="history-item">
                <h4>${workout.type.charAt(0).toUpperCase() + workout.type.slice(1)} Body</h4>
                <p><strong>${date}</strong></p>
                <p>${exerciseList || 'No exercises recorded'}</p>
            </div>
        `;
    }).join('');
}

