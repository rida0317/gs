// src/services/library.service.ts - Library management service (Supabase Version)

import { supabase } from '../lib/supabaseClient'

export interface Book {
  id: string
  title: string
  author: string
  isbn: string
  category: string
  totalCopies: number
  availableCopies: number
  location: string
  description?: string
  coverImage?: string
  publishedYear?: number
  publisher?: string
  language?: string
  pages?: number
  createdAt: string
  updatedAt: string
}

export interface BookLoan {
  id: string
  bookId: string
  bookTitle: string
  studentId: string
  studentName: string
  classId: string
  loanDate: string
  dueDate: string
  returnDate?: string
  status: 'borrowed' | 'returned' | 'overdue' | 'lost'
  notes?: string
  borrowedBy: string
  borrowedByName: string
  createdAt: string
  updatedAt: string
}

export interface LibraryStats {
  totalBooks: number
  totalCopies: number
  availableCopies: number
  borrowedBooks: number
  overdueBooks: number
  lostBooks: number
  byCategory: Record<string, number>
  topBorrowedBooks: { bookId: string; title: string; borrowCount: number }[]
}

class LibraryService {
  private books: Book[] = []
  private loans: BookLoan[] = []

  constructor() {
    this.loadFromLocalStorage()
  }

  /**
   * Add new book to library
   */
  async addBook(book: Omit<Book, 'id' | 'createdAt' | 'updatedAt' | 'availableCopies'>): Promise<Book> {
    const newBook: Book = {
      ...book,
      id: this.generateId(),
      availableCopies: book.totalCopies,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Save to Firebase
    try {
      await addDoc(collection(db, 'library_books'), {
        ...book,
        availableCopies: book.totalCopies,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error saving book to Firebase:', error)
    }

    this.books.unshift(newBook)
    this.saveToLocalStorage()

    return newBook
  }

  /**
   * Update book
   */
  async updateBook(bookId: string, updates: Partial<Book>): Promise<Book | null> {
    const index = this.books.findIndex(b => b.id === bookId)
    if (index === -1) return null

    const updatedBook = {
      ...this.books[index],
      ...updates,
      updatedAt: new Date().toISOString()
    }

    // Update Firebase
    try {
      await updateDoc(doc(db, 'library_books', bookId), {
        ...updates,
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error updating book:', error)
    }

    this.books[index] = updatedBook
    this.saveToLocalStorage()

    return updatedBook
  }

  /**
   * Delete book
   */
  async deleteBook(bookId: string): Promise<boolean> {
    const index = this.books.findIndex(b => b.id === bookId)
    if (index === -1) return false

    // Delete from Firebase
    try {
      await deleteDoc(doc(db, 'library_books', bookId))
    } catch (error) {
      console.error('Error deleting book:', error)
    }

    this.books.splice(index, 1)
    this.saveToLocalStorage()

    return true
  }

  /**
   * Borrow a book
   */
  async borrowBook(
    bookId: string,
    studentId: string,
    studentName: string,
    classId: string,
    dueDate: string,
    borrowedBy: string,
    borrowedByName: string,
    notes?: string
  ): Promise<BookLoan | null> {
    const book = this.books.find(b => b.id === bookId)
    if (!book || book.availableCopies <= 0) return null

    const loan: BookLoan = {
      id: this.generateId(),
      bookId,
      bookTitle: book.title,
      studentId,
      studentName,
      classId,
      loanDate: new Date().toISOString(),
      dueDate,
      status: 'borrowed',
      notes,
      borrowedBy,
      borrowedByName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Save loan to Firebase
    try {
      await addDoc(collection(db, 'library_loans'), {
        ...loan,
        loanDate: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error saving loan to Firebase:', error)
    }

    // Update book available copies
    await this.updateBook(bookId, {
      availableCopies: book.availableCopies - 1
    })

    this.loans.unshift(loan)
    this.saveToLocalStorage()

    return loan
  }

  /**
   * Return a book
   */
  async returnBook(loanId: string): Promise<BookLoan | null> {
    const loan = this.loans.find(l => l.id === loanId)
    if (!loan) return null

    const book = this.books.find(b => b.id === loan.bookId)

    const updatedLoan: BookLoan = {
      ...loan,
      returnDate: new Date().toISOString(),
      status: 'returned',
      updatedAt: new Date().toISOString()
    }

    // Update loan in Firebase
    try {
      await updateDoc(doc(db, 'library_loans', loanId), {
        returnDate: serverTimestamp(),
        status: 'returned',
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error updating loan:', error)
    }

    // Update book available copies
    if (book) {
      await this.updateBook(loan.bookId, {
        availableCopies: book.availableCopies + 1
      })
    }

    // Update local state
    const index = this.loans.findIndex(l => l.id === loanId)
    if (index !== -1) {
      this.loans[index] = updatedLoan
    }

    this.saveToLocalStorage()

    return updatedLoan
  }

  /**
   * Mark book as lost
   */
  async markBookAsLost(loanId: string): Promise<BookLoan | null> {
    const loan = this.loans.find(l => l.id === loanId)
    if (!loan) return null

    const book = this.books.find(b => b.id === loan.bookId)

    const updatedLoan: BookLoan = {
      ...loan,
      status: 'lost',
      updatedAt: new Date().toISOString()
    }

    // Update loan in Firebase
    try {
      await updateDoc(doc(db, 'library_loans', loanId), {
        status: 'lost',
        updatedAt: serverTimestamp()
      })
    } catch (error) {
      console.error('Error marking book as lost:', error)
    }

    // Update book total and available copies
    if (book) {
      await this.updateBook(loan.bookId, {
        totalCopies: book.totalCopies - 1,
        availableCopies: book.availableCopies
      })
    }

    // Update local state
    const index = this.loans.findIndex(l => l.id === loanId)
    if (index !== -1) {
      this.loans[index] = updatedLoan
    }

    this.saveToLocalStorage()

    return updatedLoan
  }

  /**
   * Get books by category
   */
  getBooksByCategory(category: string): Book[] {
    return this.books.filter(b => b.category === category)
  }

  /**
   * Search books
   */
  searchBooks(query: string): Book[] {
    const searchLower = query.toLowerCase()
    return this.books.filter(b =>
      b.title.toLowerCase().includes(searchLower) ||
      b.author.toLowerCase().includes(searchLower) ||
      b.isbn.toLowerCase().includes(searchLower) ||
      b.category.toLowerCase().includes(searchLower)
    )
  }

  /**
   * Get loans by student
   */
  getLoansByStudent(studentId: string): BookLoan[] {
    return this.loans.filter(l => l.studentId === studentId && l.status === 'borrowed')
  }

  /**
   * Get overdue loans
   */
  getOverdueLoans(): BookLoan[] {
    const now = new Date()
    return this.loans.filter(l =>
      l.status === 'borrowed' &&
      new Date(l.dueDate) < now
    )
  }

  /**
   * Get library statistics
   */
  getStats(): LibraryStats {
    const totalBooks = this.books.length
    const totalCopies = this.books.reduce((sum, b) => sum + b.totalCopies, 0)
    const availableCopies = this.books.reduce((sum, b) => sum + b.availableCopies, 0)
    const borrowedBooks = totalCopies - availableCopies

    const overdueLoans = this.getOverdueLoans()
    const overdueBooks = overdueLoans.length

    const lostBooks = this.loans.filter(l => l.status === 'lost').length

    const byCategory: Record<string, number> = {}
    this.books.forEach(book => {
      byCategory[book.category] = (byCategory[book.category] || 0) + 1
    })

    // Top borrowed books
    const borrowCount: Record<string, number> = {}
    this.loans.forEach(loan => {
      borrowCount[loan.bookId] = (borrowCount[loan.bookId] || 0) + 1
    })

    const topBorrowedBooks = Object.entries(borrowCount)
      .map(([bookId, count]) => {
        const book = this.books.find(b => b.id === bookId)
        return {
          bookId,
          title: book?.title || 'Unknown',
          borrowCount: count
        }
      })
      .sort((a, b) => b.borrowCount - a.borrowCount)
      .slice(0, 10)

    return {
      totalBooks,
      totalCopies,
      availableCopies,
      borrowedBooks,
      overdueBooks,
      lostBooks,
      byCategory,
      topBorrowedBooks
    }
  }

  /**
   * Subscribe to library updates
   */
  subscribeToBooks(): () => void {
    const q = query(
      collection(db, 'library_books'),
      orderBy('title', 'asc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const books: Book[] = []
      snapshot.forEach((doc) => {
        books.push({
          id: doc.id,
          ...doc.data()
        } as Book)
      })
      this.books = books
      this.saveToLocalStorage()
    })

    return unsubscribe
  }

  /**
   * Subscribe to loans
   */
  subscribeToLoans(): () => void {
    const q = query(
      collection(db, 'library_loans'),
      orderBy('loanDate', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loans: BookLoan[] = []
      snapshot.forEach((doc) => {
        loans.push({
          id: doc.id,
          ...doc.data()
        } as BookLoan)
      })
      this.loans = loans
      this.saveToLocalStorage()
    })

    return unsubscribe
  }

  /**
   * Load from localStorage
   */
  private loadFromLocalStorage(): void {
    const savedBooks = localStorage.getItem('library_books')
    const savedLoans = localStorage.getItem('library_loans')
    
    if (savedBooks) {
      this.books = JSON.parse(savedBooks)
    }
    if (savedLoans) {
      this.loans = JSON.parse(savedLoans)
    }
  }

  /**
   * Save to localStorage
   */
  private saveToLocalStorage(): void {
    localStorage.setItem('library_books', JSON.stringify(this.books.slice(0, 100)))
    localStorage.setItem('library_loans', JSON.stringify(this.loans.slice(0, 200)))
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}

// Export singleton instance
export const libraryService = new LibraryService()

// Export factory function
export const createLibraryService = (): LibraryService => new LibraryService()

export default libraryService
