/*
 * Playground for suneditor-emojis
 * Copyright 2025- David Konrad
 */

"use strict";

const Playground = (function() {
	const gebi = (id) => { return document.getElementById(id) }
	const qsel = (sel) => { return document.querySelector(sel) }
	const qall = (sel) => { return document.querySelectorAll(sel) }
	const default_iconSize = '1.7rem'
	const storage_prefix = 'suneditor-emoji_'
	let editor = undefined
	let version = undefined
	let initmode = undefined

	const init = function() {
		fetchVersions()
		initForm()
		initStorage()
		initFooter()
	}

	const wait = function(mode) {
		const b = qsel('body')
		if (!mode) {
			b.classList.remove('wait')
			window.scrollTo({ top: 0 })
		} else {
			b.classList.add('wait')
		}
	}

	const isVersion = function(str, version) {
		return str.localeCompare(version, undefined, { numeric: true, sensitivity: 'base' }) >= 0
	}

	const fetchVersions = function() {
		let v = storage('suneditor-versions-list') || false
		if (v) {
			initVersions(JSON.parse(v)) 
		} else {
			try {
				fetch('https://registry.npmjs.org/suneditor', {
					method: 'GET',
					headers: { 'Accept': 'application/json' }
				})
				.then(response => response.json())
				.then(function(response) {
					v = Object.keys(response.versions).sort(function(a, b) {
						return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }) //https://stackoverflow.com/a/65687141/1407478
					})
					v = v.filter(function(a) {
						if (a.localeCompare('2.35.0', undefined, { numeric: true, sensitivity: 'base' }) >= 0) return a
					})
					storage({ 'suneditor-versions-list': v })
					initVersions(v)
				})
			} catch(error) {
				console.log('fetchVersions', error)
			}
		}
	}

	const initVersions = function(versions) {
		version = storage('suneditor-version') || 'latest'
		fetchSunEditor()
		const sel = gebi('select-versions')
		versions.forEach(function(ver) {
			if (isVersion(ver, '3.0.0')) {
				sel.insertAdjacentHTML('beforeend', `<option value="${ver}" style="color:gray;" title="v3 is not supported (yet)">${ver}</option>`)
			} else {
				sel.insertAdjacentHTML('afterbegin', `<option value="${ver}">${ver}</option>`)
			}
		})
		setTimeout(function() {
			sel.insertAdjacentHTML('afterbegin', '<option value="latest" title="@latest is 2.47.5">latest</option>')
			sel.value = version
		})
		sel.onchange = function() {
			storage( { 'suneditor-version': this.value })
			location.reload()
		}
	}

	const fetchSunEditor = function() {
		wait(true)
		const h = document.head
		const l = document.createElement('link')
		const s = document.createElement('script')
		l.setAttribute('rel', 'stylesheet')
		if (version !== 'latest' && isVersion(version, '3.0.0')) {
			l.setAttribute('href', 'https://cdn.jsdelivr.net/npm/suneditor@' + version + '/dist/suneditor.min.css')
			s.setAttribute('src', 'https://cdn.jsdelivr.net/npm/suneditor@' + version + '/dist/suneditor.min.js')
			/* use Pre-packaged SunEditor 3 alpha v20, https://github.com/JiHong88/suneditor/issues/1533
			l.setAttribute('href', 'Pre-packaged SunEditor 3 alpha v20/suneditor.min.css')
			s.setAttribute('src', 'Pre-packaged SunEditor 3 alpha v20/suneditor.min.js')
			*/
			initmode = 'v3'
		} else { 
			l.setAttribute('href', 'https://cdn.jsdelivr.net/npm/suneditor@' + version + '/dist/css/suneditor.min.css')
			s.setAttribute('src', 'https://cdn.jsdelivr.net/npm/suneditor@' + version + '/dist/suneditor.min.js')
		}
		s.addEventListener('load', function() {
			updateEditor()
			wait()
		})
		h.prepend(l)
		h.appendChild(s)
	}

	const storage = function(o) {
		const name = (s) => storage_prefix + s
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

	const initFooter = function() {
		gebi('footer-reset-storage').onclick = function() {
			Object.keys(localStorage).forEach(function(key){
				if (key.startsWith(storage_prefix)) {
					localStorage.removeItem(key)
				}
			})
			setTimeout(function() {
				location.reload()
			})
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
		let gc = storage('save-groups-captions') || false
		const check_storage = storage('save-settings') || true
		const div = gebi('option-groups-captions').querySelector('div')
		if (gc && check_storage !== 'false') {
			gc = JSON.parse(gc)
			gc.forEach(function(item) {
				const c = item.checked ? 'checked' : ''
				const d = item.checked ? '' : 'disabled'
				const s = item.checked ? 'display:table-row;' : 'display:table-row;color:rgb(170, 170, 170);'
				div.insertAdjacentHTML('beforeend', `<div class="item-sortable" style="${s}" title="${item.group}">
					<label class="fieldset-item" style="display:table-cell;cursor:pointer">
						<input type="checkbox" name="${item.group}" ${c}>${item.group}</label>
					</label>
					<input class="fieldset-item" type="text" name="${item.group}" value="${item.caption}" style="display:table-cell;" spellcheck="false" ${d}>
				</div>`)
			})
		} else {
			const groups = ['Smileys & Emotion', 'Activities', 'Animals & Nature', 'Flags', 'Food & Drink', 'Objects', 'People & Body', 'Symbols', 'Travel & Places']
			for (const group of groups) {
				div.insertAdjacentHTML('beforeend', `<div class="item-sortable" style="display:table-row;" title="${group}">
					<label class="fieldset-item" style="display:table-cell;cursor:pointer">
						<input type="checkbox" name="${group}" checked>${group}</label>
					</label>
					<input class="fieldset-item" type="text" name="${group}" value="${group}" style="display:table-cell;" spellcheck="false">
				</div>`)
			}
		}

		div.insertAdjacentHTML('beforeend', `<div style="display:table-row;font-size:small;user-select:false;">
			<span style="display:table-cell;"></span>
			<label style="display:table-cell;cursor:pointer;text-align:right;padding-top:.3rem;" title="One large group">
				No captions
				<input type="checkbox" id="option-captions-disable" style="position:relative;top:2px;">
			</label></div>`)

		initOrderable(div, 'groups-captions')
		initGroups()

		initOrderable(qsel('#option-topmenu div'), 'topmenu')

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
			select.appendChild(option)
			size += 0.2
		}
		updateCurrent(storage('save-iconSize') || default_iconSize)
		select.addEventListener('change', function() {
			updateCurrent(this.value)
		})

		qall('aside details').forEach(function(d) {
			d.ontoggle = function() {
				storage({ [this.id]: !this.open ? 'closed' : undefined })
			}
			if (storage(d.id)) d.open = false
		})
	}

	const initStorage = function() {
		const check_storage = gebi('check-save-settings')
		check_storage.onclick = function() {
			storage({'save-settings': this.checked.toString() })
		}
		const ss = storage('save-settings')
		if (ss === 'true') {
			check_storage.checked = true
		} else if (ss === 'false') {
			check_storage.checked = false
		} else {
			check_storage.checked = true
		}

		const initCheck = function(sel, storName, defVal) {
			const val = storage(storName)
			const input = qsel(sel)
			if (check_storage.checked) {
				if (val === 'true') {
					input.checked = true
				} else if (val === 'false') {
					input.checked = false
				} else {
					input.checked = defVal
				}
			}
			input.addEventListener('click', function() {
				updateEditor()
				if (check_storage.checked) {
					storage({ [storName]: this.checked.toString() })
				}
			})
		}

		const initSelect = function(sel, storName, defVal) {
			const val = storage(storName)
			const select = qsel(sel)
			if (check_storage.checked) {
				select.value = val ? val : defVal
			}
			select.addEventListener('change', function() {
				updateEditor()
				if (check_storage.checked) {
					storage({ [storName]: this.value })
				}
			})
		}

		const skinTone = storage('save-skinTone') || 'neutral'
		qall('#option-skinTone input[name="skinTone"]').forEach(function(input) {
			if (check_storage.checked) if (input.value === skinTone) input.checked = true
			input.addEventListener('click', function() {
				updateEditor()
				if (check_storage.checked) {
					storage({ 'save-skinTone': this.value })
				}
			})
		})

		initCheck('#option-showFallbacks input', 'save-showFallbacks', true)
		initCheck('#option-showRecent input', 'save-showRecent', false)
		initCheck('#option-topmenu input[name="search"]', 'save-topMenu-search', false)
		initCheck('#option-topmenu input[name="iconSize"]', 'save-topMenu-iconSize', false)
		initCheck('#option-topmenu input[name="skinTone"]', 'save-topMenu-skinTone', false)

		initSelect('#option-tagName select', 'save-tagName', 'span')
		initSelect('#option-width select', 'save-width', '')
		initSelect('#option-height select', 'save-height', '')
		initSelect('#option-iconSize select', 'save-iconSize', default_iconSize)

		initCheck('#option-captions-disable', 'save-captions-disable', false)
		const cd = storage('save-captions-disable')
		if (cd === 'true') {
			qall('#option-groups-captions input[type="text"]').forEach(function(input) {
				input.setAttribute('disabled', 'disabled')
			})
		}

		//groups and captions
		const updateStorage = function() {
			const items = []	
			qall('#option-groups-captions .item-sortable').forEach(function(item) {
				items.push({
					group: item.querySelector('input[type="checkbox"]').getAttribute('name'),
					checked: item.querySelector('input[type="checkbox"]').checked,
					caption: item.querySelector('input[type="text"]').value
				})
			})
			storage({ 'save-groups-captions': items })
		}
		qall('#option-groups-captions input[type="text"]').forEach(function(input) {
			input.addEventListener('input', function() {
				updateStorage()
			})
		})
		qall('#option-groups-captions .item-sortable').forEach(function(item) {
			item.addEventListener('dragend', function() {
				updateStorage()
			})
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
/*
				const options = {
					iframe: false, //!!v3
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
*/
		opt = opt || {}
		//const options = {}
		let options = undefined
		const focus = editor ? false : true
		if (editor) editor.destroy()
		switch (initmode) {
			case 'v3' :
				options = {
					plugins: SUNEDITOR.Plugins, // eslint-disable-line no-undef
					buttonList: [
						['font', 'fontSize', 'formatBlock'], // ['emojis'],
						['bold', 'underline', 'italic', 'strike', 'removeFormat'],
						['fontColor'], 
					],
					mode: 'classic',
				}
				editor = SUNEDITOR.create(document.querySelector('#editor'), options)	// eslint-disable-line no-undef
				break;
			default : 
				options = {
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
				editor = SUNEDITOR.create('editor', options)	// eslint-disable-line no-undef
				break;
		}
		qsel('.sun-editor-editable').tabIndex = -1
		if (focus) qsel('.sun-editor-editable').focus()
	}

	return {
		init
	}

})()

window.addEventListener("DOMContentLoaded", function() {
	Playground.init()
})	

