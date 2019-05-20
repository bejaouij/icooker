/*
 * Remove all invalid feedbacks in the specified form
 */
function clearErroredFields(formId = '') {
	Array.from(document.querySelectorAll(formId + ' .is-invalid'), function(element) {
		this.classList.remove('is-invalid');
	});

	Array.from(document.querySelectorAll(formId + ' .general-information'), function(element) {
		this.innerText = '';
	});
}

window.onload = function() {
	/* Retrieve the user session status */
	request('GET', '/api/user/session_status', null, function(res) {
		var $navActions = document.querySelector('nav#navbar > div');

		/* Create related menu tabs */
		for(var action in res.actions) {
			var $newActionTab = document.createElement('ARTICLE');
			$newActionTab.id = action + '-trigger';
			$newActionTab.classList.add('col-12', 'px-3', 'py-2');
			$newActionTab.innerText = action[0].toUpperCase() + action.substr(1);
			$newActionTab.setAttribute('data-session-depending', true);
			$newActionTab.setAttribute('data-href', res.actions[action]);

			/* Require to open a modal to continue */
			if(res.session_status == false) {
				$newActionTab.setAttribute('data-toggle', 'modal');
				$newActionTab.setAttribute('data-target', '#' + action + '_modal');

				document.getElementById(action + '_form').setAttribute('action', res.actions[action]);
			}
			/* Only require to execute the related request */
			else {
				$newActionTab.addEventListener('click', function() {
					/* AJAX request */
					if(this.getAttribute('data-href').indexOf('/api/') != -1) {
						// We know this request is the logout one.
						request('PUT', this.getAttribute('data-href'), null, undefined);
						window.location.replace('.');
					}
					/* Page request */
					else {
						window.location.replace(this.getAttribute('data-href'));
					}
					////////////////////
				});
			}
			////////////////////

			$navActions.appendChild($newActionTab);
		}
		////////////////////
	});
	////////////////////

	/* Navbar component */
	document.getElementById('hamburger-button').addEventListener('click', function() {
	  this.classList.toggle('opened');

	  document.getElementById('navbar').classList.toggle('opened');
	});

	Array.from(document.querySelectorAll('nav#navbar article')).forEach(function(element) {
		if(element.getAttribute('data-href') != null) {
			element.addEventListener('click', function() {
				window.location.replace(this.getAttribute('data-href'));
			});
		}
	});
	/********************/

	/* Login form behaviour */
	document.getElementById('login_custom_submit_btn').addEventListener('click', function(event) {
		event.preventDefault();

		document.getElementById('login_submit_btn').click();
	});

	document.getElementById('login_form').addEventListener('submit', function(event) {
		event.preventDefault();
		var data = {};

		Array.from(document.querySelectorAll('form#login_form input')).forEach(function(element) {
			data[element.id] = element.value;
		});

		request('PUT', this.getAttribute('action'), data, function(res) {
			window.location.replace('.');
		}, function(res) {
			switch(res.errorCode) {
				case 201:
				document.getElementById('user_email').classList.add('is-invalid');
				document.getElementById('user_password').classList.remove('is-invalid');
				document.querySelector('#login_form small.general-information').innerText = '';
				break;

				case 202:
				document.getElementById('user_password').classList.add('is-invalid');
				document.getElementById('user_email').classList.remove('is-invalid');
				document.querySelector('#login_form small.general-information').innerText = '';
				break;

				case 204:
				document.getElementById('user_password').classList.remove('is-invalid');
				document.getElementById('user_email').classList.remove('is-invalid');
				document.querySelector('#login_form small.general-information').innerText = res.humanReadableFeedback;
				break;

				default:
				document.getElementById('user_password').classList.remove('is-invalid');
				document.getElementById('user_email').classList.remove('is-invalid');
				document.querySelector('#login_form small.general-information').innerText = 'An unknowed error has occured...';
			}
		});
	});
	/********************/

	/* Sign in form behaviour */
	document.getElementById('signin_user_password').addEventListener('focusout', function() {
		if(this.value.length < 6) {
			this.classList.add('is-invalid');
		}
		else {
			this.classList.remove('is-invalid')
		}
	});

	document.getElementById('signin_user_password_confirmation').addEventListener('focusout', function() {
		if(this.value != document.getElementById('signin_user_password').value) {
			this.classList.add('is-invalid');
		}
		else {
			this.classList.remove('is-invalid');
		}
	});

	document.getElementById('signin_custom_submit_btn').addEventListener('click', function(event) {
		event.preventDefault();

		document.getElementById('signin_submit_btn').click();
	});

	document.getElementById('signin_form').addEventListener('submit', function(event) {
		event.preventDefault();

		var isDataValid = true;

		event.preventDefault();
		var data = {};

		Array.from(document.querySelectorAll('form#signin_form input')).forEach(function(element) {
			data[element.id] = element.value;

			if(element.value == '') {
				element.classList.add('is-invalid');
				isDataValid = false;
			}
		});

		if(data['signin_user_password'].length < 6) {
			document.getElementById['signin_user_password'].classList.add('is-invalid');
			isDataValid = false;
		}
		
		if(data['signin_user_password_confirmation'] != data['signin_user_password']) {
			document.getElementById('signin_user_password_confirmation').classList.add('is-invalid');
			isDataValid = false;
		}


		if(isDataValid) {
			request('POST', this.getAttribute('action'), data, function(res) {
				window.location.replace('/profile');
			}, function(res) {
				clearErroredFields('signin_form');

				for(var fieldId in res.erroredFieldsId) {
					document.getElementById(fieldId).classList.add('is-invalid');
					document.querySelector('signin_form general-information').innerText = res.errorGeneralInformation;
				}
			});
		};
	});
	/********************/
};