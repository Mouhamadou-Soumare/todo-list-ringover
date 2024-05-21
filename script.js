document.addEventListener('DOMContentLoaded', () => {
	const apiUrl = 'http://localhost:9000/v1';

	const taskList = document.getElementById('task-list');
	const completedTaskList = document.getElementById('completed-task-list');
	const clearCompletedTasksBtn = document.getElementById('clear-completed-tasks-btn');

	const openPopupBtn = document.getElementById('open-popup-btn');
	const taskPopup = document.getElementById('task-popup');
	const closePopupBtn = taskPopup.querySelector('.close-btn');
	const popupForm = document.getElementById('popup-form');

	const openSearchPopupBtn = document.getElementById('open-search-popup-btn');
	const searchPopup = document.getElementById('search-popup');
	const closeSearchPopupBtn = searchPopup.querySelector('.close-btn');
	const searchForm = document.getElementById('search-form');

	const popupContainer = document.querySelector('.popup-container');
	const descriptionPopup = document.getElementById('description-popup');
	
	openPopupBtn.addEventListener('click', () => {
		popupContainer.style.display = 'flex';
		taskPopup.style.display = 'block';
		searchPopup.style.display = 'none';
		descriptionPopup.style.display = 'none';
	});

	closePopupBtn.addEventListener('click', () => {
		popupContainer.style.display = 'none';
	});

	openSearchPopupBtn.addEventListener('click', () => {
		popupContainer.style.display = 'flex';
		searchPopup.style.display = 'block';
		taskPopup.style.display = 'none';
		descriptionPopup.style.display = 'none';
	});

	closeSearchPopupBtn.addEventListener('click', () => {
		popupContainer.style.display = 'none';
	});


	window.addEventListener('click', (event) => {
		if (event.target === popupContainer) {
			popupContainer.style.display = 'none';
		}
	});

	popupForm.addEventListener('submit', (event) => {
		event.preventDefault();
		addTask();
	});

	searchForm.addEventListener('submit', (event) => {
		event.preventDefault();
		searchTasks();
	});





	clearCompletedTasksBtn.addEventListener('click', () => {
		clearCompletedTasks();
	});

	let tasks = [];

	// Formate la date au format requis par l'API
	function formatDateString(dateString) {
		const [year, month, day] = dateString.split('-');
		return `${year}-${month}-${day}T00:00:00Z`;
	}

	// Affichage de la description
	function showTaskDescription(description) {
		const descriptionPopup = document.getElementById('description-popup');
		const descriptionContent = descriptionPopup.querySelector('#task-description');
		descriptionContent.textContent = description;
		popupContainer.style.display = 'flex';
		searchPopup.style.display = 'none';
		taskPopup.style.display = 'none';
		descriptionPopup.style.display = 'block';


		const closeDescriptionPopupBtn = descriptionPopup.querySelector('.close-btn');
		closeDescriptionPopupBtn.addEventListener('click', () => {
			descriptionPopup.style.display = 'none';
		});
	}

	function areAllTasksCompleted() {
		return tasks.every(task => new Date(task.end_date) < new Date());
	}

	function formatDate(dateString) {
		const date = new Date(dateString);
		const day = date.getDate().toString().padStart(2, '0');
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		const year = date.getFullYear();
		return `${day}/${month}/${year}`;
	}

	// Fonction permettant la récupération des tâches sur l'endpoint GET ALL_Tasks 
	function fetchTasks() {

		fetch(`${apiUrl}/tasks`)
			.then(response => response.json())
			.then(data => {

				tasks = data;
				renderTasks();
			})
			.catch(error => console.error('Error fetching tasks:', error));
	}

	// Ajoute une nouvelle tâche via l'API
	function addTask() {
		const title = document.getElementById('popup-task-title').value;
		const description = document.getElementById('popup-task-desc').value;
		const startDate = formatDateString(document.getElementById('popup-task-start-date').value);
		if (!title || !startDate) {
			alert('Remplir tout les champs');
			return;
		}

		const taskData = {
			label: title,
			description: description,
			start_date: startDate
		};

		fetch(`${apiUrl}/tasks`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(taskData)
			})
			.then(response => {
				if (!response.ok) {
					throw new Error(`Failed to add task: ${response.statusText}`);
				}
				if (response.status === 201) {
					return null;
				}
				return response.json();
			})
			.then(task => {
				if (!task) {
					popupForm.reset();
					const addResults = document.getElementById('add-results');
					addResults.classList.remove('error-result');

					addResults.classList.add('good-result');

					addResults.textContent = 'Tâche ajoutée !';


					setTimeout(() => {
						addResults.textContent = '';
						popupContainer.style.display = 'none';
					}, 3000);
				} else {
					tasks.push(task);
					if (new Date(task.end_date) < new Date()) {
						appendCompletedTaskToList(task, tasks.length - 1);
					} else {
						appendTaskToList(task, tasks.length - 1);
					}
					const addResults = document.getElementById('add-results');
					addResults.classList.remove('remove-result');
					addResults.classList.add('good-result');
					addResults.textContent = 'Tâche ajoutée !';

					setTimeout(() => {
						addResults.textContent = '';
						popupContainer.style.display = 'none';
					}, 3000); // Fermeture du popup après 3 secondes
				}
			})
			.catch(error => {
				console.error('Error adding task:', error);
				const addResults = document.getElementById('add-results');
				addResults.classList.remove('good-result');
				addResults.classList.add('error-result');
				addResults.textContent = 'Tâches déjà existantes';
			});
	}



	// Recherche des tâches par titre via l'API
	function searchTasks() {
		const title = document.getElementById('search-task-title').value;

		if (!title) {
			console.error('Title is required for searching tasks.');
			return;
		}

		fetch(`${apiUrl}/tasks/${title}`)
			.then(response => {
				if (!response.ok) {
					if (response.status === 404) {
						throw new Error('Task not found.');
					}
					throw new Error(`Error searching tasks: ${response.statusText}`);
				}
				return response.json();
			})
			.then(data => {
				tasks = Array.isArray(data) ? data : [data];
				renderTasks();
				searchPopup.style.display = 'none';
				popupContainer.style.display = 'none';
			})
			.catch(error => {
				if (error.message === 'Task not found.') {
					const searchResultsContainer = document.getElementById('search-results');
					searchResultsContainer.classList.add('form-submit-results', 'error-result');
					searchResultsContainer.textContent = 'Aucun résultat trouvé pour le label spécifié.';
				} else {
					console.error(error.message);
				}
			});
	}


	// Marque une tâche comme complétée 
	function validateTask(index) {
		const task = tasks[index];
		const endDate = new Date().toISOString();

		fetch(`${apiUrl}/tasks/${task.label}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					end_date: endDate
				})
			})
			.then(response => {
				if (!response.ok) {
					throw new Error(`Failed to validate task: ${response.statusText}`);
				}
				return response.json();
			})
			.then(updatedTask => {
				tasks[index].end_date = updatedTask.end_date;
				fetchTasks();
			})
			.catch(error => console.error('Error validating task:', error));
	}


	// Supprime une tâche
	function deleteTask(index) {
		const task = tasks[index];

		fetch(`${apiUrl}/tasks/${task.label}`, {
				method: 'DELETE'
			})
			.then(() => {
				tasks.splice(index, 1);
				fetchTasks();
			})
			.catch(error => console.error('Error deleting task:', error));
	}


	// Affiche les tâches dans la liste correspondantes, en cours ou terminées
	function renderTasks() {
		taskList.innerHTML = '';
		completedTaskList.innerHTML = '';
		let onGoingTasksExist = false;

		tasks.forEach((task, index) => {
			if (new Date(task.end_date) < new Date()) {
				appendCompletedTaskToList(task, index);
			} else {
				onGoingTasksExist = true;
				appendTaskToList(task, index);
			}
		});

		if (!onGoingTasksExist && areAllTasksCompleted()) {
			const li = document.createElement('li');
			li.textContent = 'Aucune tâche en cours';
			taskList.appendChild(li);
		}
	}

	// Ajoute une tâche à la liste des tâches en cours
	function appendTaskToList(task, index) {
		const li = document.createElement('li');
		li.className = 'list-group-item flex-row gap-sm';
		li.innerHTML = `
            <div class="flex-row gap-std">
                <div><p>${task.label}</p></div>
                <div><button class="show-description-btn"><svg fill="#000000" width="22" height="22" viewBox="0 0 128 128" id="Layer_1" version="1.1" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">

				<g>
				
				<path d="M64,1C29.3,1,1,29.3,1,64s28.3,63,63,63s63-28.3,63-63S98.7,1,64,1z M64,119C33.7,119,9,94.3,9,64S33.7,9,64,9   s55,24.7,55,55S94.3,119,64,119z"/>
				
				<rect height="40" width="8" x="60" y="54.5"/>
				
				<rect height="8" width="8" x="60" y="35.5"/>
				
				</g>
				
				</svg></button></div>
                <div><p>${formatDate(task.start_date)}</p></div>
            </div>
            <div class="flex-row gap-std">
                <button class="validate-task-btn">
				<svg width="22" height="22" fill="#2d7e85" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
				  <path fill="none" stroke="#2d7e85" stroke-width="2" d="M20,15 C19,16 21.25,18.75 20,20 C18.75,21.25 16,19 15,20 C14,21 13.5,23 12,23 C10.5,23 10,21 9,20 C8,19 5.25,21.25 4,20 C2.75,18.75 5,16 4,15 C3,14 1,13.5 1,12 C1,10.5 3,10 4,9 C5,8 2.75,5.25 4,4 C5.25,2.75 8,5 9,4 C10,3 10.5,1 12,1 C13.5,1 14,3 15,4 C16,5 18.75,2.75 20,4 C21.25,5.25 19,8 20,9 C21,10 23,10.5 23,12 C23,13.5 21,14 20,15 Z M7,12 L10,15 L17,8"/>
				</svg></button>
                <button class="delete-task-btn"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path stroke="#A34343" d="M10 12L14 16M14 12L10 16M4 6H20M16 6L15.7294 5.18807C15.4671 4.40125 15.3359 4.00784 15.0927 3.71698C14.8779 3.46013 14.6021 3.26132 14.2905 3.13878C13.9376 3 13.523 3 12.6936 3H11.3064C10.477 3 10.0624 3 9.70951 3.13878C9.39792 3.26132 9.12208 3.46013 8.90729 3.71698C8.66405 4.00784 8.53292 4.40125 8.27064 5.18807L8 6M18 6V16.2C18 17.8802 18 18.7202 17.673 19.362C17.3854 19.9265 16.9265 20.3854 16.362 20.673C15.7202 21 14.8802 21 13.2 21H10.8C9.11984 21 8.27976 21 7.63803 20.673C7.07354 20.3854 6.6146 19.9265 6.32698 19.362C6 18.7202 6 17.8802 6 16.2V6" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
				</svg></button>
            </div>
        `;
		li.querySelector('.validate-task-btn').addEventListener('click', () => validateTask(index));
		li.querySelector('.delete-task-btn').addEventListener('click', () => deleteTask(index));

		li.querySelector('.show-description-btn').addEventListener('click', () => {
			const description = task.description;
			showTaskDescription(description);
		});

		taskList.appendChild(li);
	}


	// Ajoute une tâche à la liste des tâches complétées
	function appendCompletedTaskToList(task, index) {
		const li = document.createElement('li');
		li.className = 'list-group-item flex-row gap-sm';
		li.innerHTML = `
            <div class="flex-row gap-std">
                <p>${task.label}</p>
                <p>${formatDate(task.start_date)}</p>
                <p>${formatDate(task.end_date)}</p>
            </div>
        `;
		completedTaskList.appendChild(li);
	}

	//Supprime toutes les tâches complétées
	function clearCompletedTasks() {
		const completedTasks = tasks.filter(task => new Date(task.end_date) < new Date());

		completedTasks.forEach(task => {
			fetch(`${apiUrl}/tasks/${task.label}`, {
					method: 'DELETE'
				})
				.then(response => {
					if (!response.ok) {
						throw new Error(`Failed to delete task: ${response.statusText}`);
					}
				})
				.catch(error => console.error('Error deleting task:', error));
		});

		tasks = tasks.filter(task => new Date(task.end_date) >= new Date());

		renderTasks();
	}



	fetchTasks();
});