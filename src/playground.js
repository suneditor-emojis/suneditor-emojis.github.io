"use strict";

const Playground = (function() {
	const gebi = (id) => { return document.getElementById(id) }
	const qsel = (sel) => { return document.querySelector(sel) }
	const qall = (sel) => { return document.querySelectorAll(sel) }
	const default_iconSize = '1.7rem'
	let editor = undefined
	
	const init = function() {
		fetchVersions()
		initForm()
	}

	const fetchVersions = function() {
		return new Promise(function(resolve) {
			try {
				fetch('https://registry.npmjs.org/suneditor', {
					method: 'GET',
					headers: { 'Accept': 'application/json' }
				})
				.then(response => response.json())
				.then(response => resolve(initVersions(response)))
			} catch(error) {
				console.log('fetchVersions', error)
				resolve(error)
			}
		})
	}

	const initVersions = function(r) {
/*
		const prefix = {
			'2.0': {
				js: '/src/',
				css: '/src/css/
*/
		const version = storage('suneditor-version') || 'latest'
		//setVersion(version)
		fetchSunEditor(version)
		const sel = gebi('select-versions')
		const versions = Object.keys(r.versions).sort(function(a,b) {
			return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
		})
/*
		Object.keys(r.versions).forEach(function(ver) {
			if (ver.localeCompare('2.0.0', undefined, { numeric: true, sensitivity: 'base' }) === 1) { //https://stackoverflow.com/a/65687141/1407478
				sel.insertAdjacentHTML('afterbegin', `<option value="${ver}">${ver}</option>`)
			}
		})
*/
		versions.forEach(function(ver) {
			sel.insertAdjacentHTML('afterbegin', `<option value="${ver}">${ver}</option>`)
		})

		setTimeout(function() {
			sel.insertAdjacentHTML('afterbegin', '<option value="latest">latest</option>')
			sel.value = version
		})
		sel.onchange = function() {
			storage( { 'suneditor-version': this.value })
			location.reload()
			//setVersion(this.value, true)
		}
	}

/*
	const setVersion = function(ver) {
		const h = document.head
		let c = h.querySelector('#suneditor-css')
		if (!c) {
			c = document.createElement('link')
			c.setAttribute('id', 'suneditor-css')
			c.setAttribute('rel', 'stylesheet')
			h.prepend(c)
		}
		const fname = ver.localeCompare('3.0.0', undefined, { numeric: true, sensitivity: 'base' }) >= 0 ? '/dist/suneditor.min.css' : '/dist/css/suneditor.min.css'
		c.setAttribute('href', 'https://cdn.jsdelivr.net/npm/suneditor@' + ver + fname)
		let s = h.querySelector('#suneditor-js')
		if (!s) {
			s = document.createElement('script')
			s.setAttribute('id', 'suneditor-js')
		}
		s.onload = function() {
			console.log('ok')
			updateEditor()
		}
		s.setAttribute('src', 'https://cdn.jsdelivr.net/npm/suneditor@' + ver + '/dist/suneditor.min.js')
		h.appendChild(s)
//		s.addEventListener('load', function() {
	}
*/
	const fetchSunEditor = function(ver) {
		const setVer3 = function(l, s) {
			l.setAttribute('href', 'https://cdn.jsdelivr.net/npm/suneditor@' + ver + '/dist/suneditor.min.css')
			s.setAttribute('type', 'module')
			s.setAttribute('src', 'https://cdn.jsdelivr.net/npm/suneditor@' + ver + '/src/suneditor.js')
		}
		const setVer228 = function(l, s) {
			l.setAttribute('href', 'https://cdn.jsdelivr.net/npm/suneditor@' + ver + '/dist/css/suneditor.min.css')
			s.setAttribute('src', 'https://cdn.jsdelivr.net/npm/suneditor@' + ver + '/dist/suneditor.min.js')
		}

		const h = document.head
		const l = document.createElement('link')
		l.setAttribute('rel', 'stylesheet')
		const s = document.createElement('script')

		if (ver.localeCompare('3.0.0', undefined, { numeric: true, sensitivity: 'base' }) >= 0) {
			console.log('v3')
			setVer3(l, s)
		} else if (ver.localeCompare('2.28.0', undefined, { numeric: true, sensitivity: 'base' }) >= 0) {
			console.log('v228')
			setVer228(l, s)
		}

		s.addEventListener('load', function() {
			updateEditor()
		})

		h.prepend(l)
		h.appendChild(s)
/*
		//const fname = ver.localeCompare('3.0.0', undefined, { numeric: true, sensitivity: 'base' }) >= 0 ? '/dist/suneditor.min.css' : '/dist/css/suneditor.min.css'
		//c.setAttribute('href', 'https://cdn.jsdelivr.net/npm/suneditor@' + ver + fname)
		//let s = h.querySelector('#suneditor-js')
		s.onload = function() {
			console.log('ok')
			updateEditor()
		}
		s.setAttribute('src', 'https://cdn.jsdelivr.net/npm/suneditor@' + ver + '/dist/suneditor.min.js')
		h.appendChild(s)
//		s.addEventListener('load', function() {
*/
	}

	const storage = function(o) {
		const name = (s) => 'suneditor-emoji_' + s
		if (typeof o === 'string') {
			return localStorage.getItem(name(o))
		}
		if (typeof o === 'object') {
			const key = Object.keys(o)[0]
			if (!o[key]) return localStorage.removeItem(name(key)) 
			const val = typeof o[key] === 'string' ? o[key] : JSON.stringify(o[key])
			return localStorage.setItem(name(key), val)
		}
	}

	const initOrderable = function(cnt, name) {
		const items = cnt.querySelectorAll('.item-sortable')
		let dragged = undefined
		let allowDrop = undefined
		for (const item of items) {
			item.draggable = true
			item.name = name
			item.ondragstart = function(e) {
				dragged = this
				e.dataTransfer.dropEffect = 'move'
				e.dataTransfer.effectAllowed = 'move'
				e.dataTransfer.setData('text/html', item.innerHTML)
				if (item.name === 'groups-captions') {
					e.dataTransfer.setData('checked', item.querySelector('input[type="checkbox"]').checked)
					e.dataTransfer.setData('value', item.querySelector('input[type="text"]').value)
				}
			}
			item.ondragover = function(e) {
				e.preventDefault()
				allowDrop = true //!? must find a way to handle illegal drops
			}
			item.ondrop = function(e) {
				e.preventDefault()
				if (dragged !== item && allowDrop) {
					dragged.innerHTML = item.innerHTML
					item.innerHTML = e.dataTransfer.getData('text/html')
					if (item.name === 'groups-captions') {
						item.querySelector('input[type="checkbox"]').checked = e.dataTransfer.getData('checked')
						item.querySelector('input[type="text"]').value = e.dataTransfer.getData('value')
					}
				}
			}
			item.ondragenter = function() {
				item.classList.add('active')
			}
			item.ondragleave = function() {
				item.classList.remove('active')
			}
			item.ondragend = function() {
				for (const item of items) item.classList.remove('active')
				initGroups()
				updateEditor()
			}
		}
	}

	const initGroups = function() {
		const cnt = qsel('#option-groups-captions div')
		cnt.querySelectorAll('input[type="checkbox"]').forEach(function(input) {
			input.onclick = function() {
				const name = this.parentElement.nextElementSibling 
				if (!this.checked) {
					name.setAttribute('disabled', 'disabled')
					this.parentElement.style.color = 'rgb(170, 170, 170)'
				} else {
					name.removeAttribute('disabled')
					this.parentElement.style.color = '#333'
				}
				updateEditor()
			}
		})
		cnt.querySelectorAll('input[type="text"]').forEach(function(input) {
			input.onfocus = function() {
				this.oldValue = this.value
				this.parentElement.draggable = false
			}
			input.onblur = function() {
				this.parentElement.draggable = true
				if (this.oldValue !== this.value) updateEditor()
			}
		})
		cnt.querySelector('#option-captions-disable').onclick = function() {
			const checked = this.checked
			cnt.querySelectorAll('input[type="text"]').forEach(function(input) {
				if (checked) {
					input.setAttribute('disabled', 'disabled')
				} else {
					input.removeAttribute('disabled')
				}
			})
			updateEditor()
		}
	}

	const initForm = function() {
		const groups = ['Smileys & Emotion', 'Activities', 'Animals & Nature', 'Flags', 'Food & Drink', 'Objects', 'People & Body', 'Symbols', 'Travel & Places']
		const div = gebi('option-groups-captions').querySelector('div')
		for (const group of groups) {
			div.insertAdjacentHTML('beforeend', `<div class="item-sortable" style="display:table-row;" title="${group}">
					<label class="fieldset-item" style="display:table-cell;cursor:pointer">
						<input type="checkbox" name="${group}" checked>${group}</label>
					</label>
					<input class="fieldset-item" type="text" name="${group}" value="${group}" style="display:table-cell;" spellcheck="false">
				</div>`)
		}

		div.insertAdjacentHTML('beforeend', `<div style="display:table-row;font-size:small;user-select:false;">
			<span style="display:table-cell;"></span>
			<label style="display:table-cell;cursor:pointer;text-align:right;padding-top:.3rem;" title="One large group">
				No captions
				<input type="checkbox" id="option-captions-disable" style="position:relative;top:2px;">
			</label></div>`)

		initOrderable(div, 'groups-captions')
		initGroups()

		qsel('#option-topmenu div').querySelectorAll('input[type="checkbox"]').forEach(function(input) {
			input.onclick = updateEditor
		})
		initOrderable(qsel('#option-topmenu div'), 'topmenu')

		qsel('#option-showRecent input').onclick = updateEditor

		const updateCurrent = function(current) {
			gebi('iconsize-current').innerText = '(' +  current +')'
		}
		const select = gebi('select-iconsize')
		let size = 0.3
		while (size < 5) {
			const option = document.createElement('option')
			const fs = parseFloat(size).toPrecision(2) + 'rem'
			option.value = fs
			option.style.fontSize = fs
			option.innerText = '😊'
			option.title = fs
			if (fs === default_iconSize) {
				option.selected = true
				updateCurrent(fs)
			}			
			select.appendChild(option)
			size += 0.2
		}
		select.onchange = function() {
			updateCurrent(this.value)
			updateEditor()
		}		

		qall('#option-skinTone input[name="skinTone"]').forEach(function(input) {
			input.onclick = updateEditor
		})

		qsel('#option-showFallbacks input').onclick =	updateEditor
		qsel('#option-tagName select').onchange = updateEditor
		qsel('#option-width select').onchange = updateEditor
		qsel('#option-height select').onchange = updateEditor

		qall('aside details').forEach(function(d) {
			d.ontoggle = function() {
				storage({ [this.id]: !this.open ? 'closed' : undefined })
			}
			if (storage(d.id)) d.open = false
		})
	}

	const updateOptions = function(options) {
		let s = ''
		if (options) {
			s = JSON.stringify(options, null, '  ')
			s = s.replace(/"([^"]+)":/g, '$1:') //https://stackoverflow.com/a/11233515/1407478
			s = 'emojis: ' + s
		}
		gebi('options').innerText = s
		initClipboard()
	}

	const initClipboard = function() {
		const action = gebi('copy-action')
		const success = gebi('copy-success')
		action.style.display = 'block'
		success.style.display = 'none'
		action.addEventListener('click', function(e) {
			e.preventDefault()
			const o = gebi('options').innerText
			try {
				navigator.clipboard.writeText(o)
				action.style.display = 'none'
				success.style.display = 'block'
			} catch (error) {
				console.error('Failed to copy: ', error)
			}
		})
	}

	const updateEditor = function() {
		const options = {
			groups: [],
			captions: [],
			topmenu: {},
		}
		qsel('#option-groups-captions div').querySelectorAll('input[type="checkbox"]').forEach(function(input) {
			if (input.checked && input.name) {
				options.groups.push(input.name)
				options.captions.push(input.parentElement.nextElementSibling.value)
			}
		})
		qsel('#option-topmenu div').querySelectorAll('input[type="checkbox"]').forEach(function(input) {
			if (input.checked) {
				options.topmenu[input.name] = true
			}
		})
		options.skinTone = qsel('#option-skinTone input[name="skinTone"]:checked').value
		options.iconSize = qsel('#option-iconSize select').value
		options.showRecent = qsel('#option-showRecent input').checked
		options.showFallbacks = qsel('#option-showFallbacks input').checked
		options.tagName = qsel('#option-tagName select').value
		options.width = qsel('#option-width select').value
		options.height = qsel('#option-height select').value
		if (qsel('#option-captions-disable').checked) options.captions = false
		updateOptions(options)
		initEditor(options)
	}

	const initEditor = function(opt) {
		opt = opt || {}
		const options = {
			mode: 'classic',
			width: '100%',
			height: 'auto',
			minHeight : '30vh',
			plugins: [emojis],	// eslint-disable-line no-undef
			buttonList: [
				['font', 'fontSize', 'formatBlock'], ['emojis'],
				['bold', 'underline', 'italic', 'strike', 'removeFormat'],
				['fontColor', 'hiliteColor'], 
			],
			defaultStyle: "font-size:1.5rem;"
		}
		options.emojis = opt 
		if (editor) editor.destroy()
		editor = SUNEDITOR.create('editor', options)	// eslint-disable-line no-undef
		//editor = SUNEDITOR.create(document.querySelector('#editor'), options)	// eslint-disable-line no-undef
		editor.setContents('<p>Lorem ipsum</p>')
		qsel('.sun-editor-editable').tabIndex = -1
		qsel('.sun-editor-editable').focus()
	}

	return {
		init
	}

})()

window.addEventListener("DOMContentLoaded", function() {
	Playground.init()
})	

