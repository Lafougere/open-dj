/* eslint-disable no-undef */

export function getBuffer(url: string): Promise<ArrayBuffer> {
	return fetch(url).then(resp => resp.arrayBuffer())
}

export function humanFileSize(size: number) {
	const i = size === 0 ? 0 : Math.floor(Math.log(size) / Math.log(1000))
	return `${parseInt((size / 1000 ** i).toFixed(2), 10) * 1} ${['B', 'k', 'MB', 'GB', 'TB'][i]}`
}

const dbPromise: Promise<IDBDatabase> = new Promise((resolve, reject) => {
	const request = indexedDB.open('handles', 1)
	request.onupgradeneeded = event => {
		const db = (event.target as any).result
		db.createObjectStore('handles', { keyPath: 'id' })
	}
	request.onsuccess = event => {
		resolve((event.target as any).result)
	}
	request.onerror = event => {
		console.error(event)
		reject((event.target as any).error)
	}
})

/**
 * Saves a directory handle to the database.
 * @param {FileSystemDirectoryHandle} dirHandle - The directory handle to save.
 * @returns {Promise<void>} A promise that resolves when the handle is saved.
 */
export const saveDirHandle = (dirHandle: FileSystemDirectoryHandle, path: string): Promise<void> =>
	new Promise((resolve, reject) => {
		console.log('save handle', path)
		dbPromise.then(db => {
			const transaction = db.transaction(['handles'], 'readwrite')
			const store = transaction.objectStore('handles')
			const request = store.put({ id: 'lastFolder', handle: dirHandle, path })
			request.onsuccess = () => resolve()
			request.onerror = () => reject(request.error)
		})
	})

/**
 * Retrieves the last saved folder handle from the database.
 * @returns {Promise<FileSystemDirectoryHandle|undefined>} A promise that resolves with the folder handle or undefined if not found.
 */
export const getLastFolderHandle = (): Promise<{ handle: FileSystemDirectoryHandle; path: string } | undefined> =>
	new Promise((resolve, reject) => {
		dbPromise.then(db => {
			const transaction = db.transaction(['handles'], 'readonly')
			const store = transaction.objectStore('handles')
			const request = store.get('lastFolder')
			request.onsuccess = event => resolve((event.target as any).result)
			request.onerror = () => reject(request.error)
		})
	})
