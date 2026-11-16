
import { useEffect, useState, type FormEvent } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

type Reader = {
  id: number;
  fullName: string;
};

type Book = {
  id: number;
  title: string;
};

type Copy = {
  id: number;
  inventoryNumber: string;
  bookId: number;
  status: string;
};

type Props = {
  onSuccess: () => void;
};

export default function IssueBookForm({ onSuccess }: Props) {
  const [readers, setReaders] = useState<Reader[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [copies, setCopies] = useState<Copy[]>([]);
  const [readerId, setReaderId] = useState("");
  const [bookCopyId, setBookCopyId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function loadCopies() {
    const response = await axios.get(`${API}/copies`);
    setCopies(
      response.data.filter((copy: Copy) => copy.status === "AVAILABLE"),
    );
  }

  useEffect(() => {
    async function loadData() {
      try {
        const [readerResponse, copyResponse, bookResponse] =
          await Promise.all([
            axios.get(`${API}/readers`),
            axios.get(`${API}/copies`),
            axios.get(`${API}/books`),
          ]);

        setReaders(readerResponse.data);
        setBooks(bookResponse.data);
        setCopies(
          copyResponse.data.filter(
            (copy: Copy) => copy.status === "AVAILABLE",
          ),
        );
      } catch {
        setError("Не вдалося завантажити дані.");
      }
    }

    void loadData();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!readerId || !bookCopyId || !dueDate) {
      setError("Заповніть усі поля.");
      return;
    }

    setLoading(true);

    try {
      await axios.post(`${API}/loans`, {
        readerId: Number(readerId),
        bookCopyId: Number(bookCopyId),
        dueDate: new Date(`${dueDate}T23:59:59`).toISOString(),
      });

      setReaderId("");
      setBookCopyId("");
      setDueDate("");

      await loadCopies();
      onSuccess();
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message
        : null;

      setError(message || "Не вдалося оформити видачу книги.");
    } finally {
      setLoading(false);
    }
  }

  function getBookTitle(bookId: number) {
    return books.find((book) => book.id === bookId)?.title
      || `Книга ID: ${bookId}`;
  }

  return (
    <form className="form-panel issue-form" onSubmit={handleSubmit}>
      <div className="form-heading">
        <h3>Оформлення видачі книги</h3>
      </div>

      {error && <div className="alert-error">{error}</div>}

      <div className="form-grid">
        <label className="field">
          <span>Читач *</span>
          <select
            required
            value={readerId}
            onChange={(event) => setReaderId(event.target.value)}
          >
            <option value="">Оберіть читача</option>
            {readers.map((reader) => (
              <option key={reader.id} value={reader.id}>
                {reader.fullName}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Доступний примірник *</span>
          <select
            required
            value={bookCopyId}
            onChange={(event) => setBookCopyId(event.target.value)}
          >
            <option value="">Оберіть примірник</option>
            {copies.map((copy) => (
              <option key={copy.id} value={copy.id}>
                {getBookTitle(copy.bookId)} — {copy.inventoryNumber}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Дата повернення *</span>
          <input
            type="date"
            required
            min={new Date().toISOString().slice(0, 10)}
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </label>
      </div>

      {readers.length === 0 && (
        <p className="form-hint">
          Спочатку додайте читача до системи.
        </p>
      )}

      {readers.length > 0 && copies.length === 0 && (
        <p className="form-hint">
          Немає доступних примірників для видачі.
        </p>
      )}

      <div className="form-actions">
        <button
          className="button-primary"
          type="submit"
          disabled={loading || readers.length === 0 || copies.length === 0}
        >
          {loading ? "Оформлення..." : "Видати книгу"}
        </button>
      </div>
    </form>
  );
}
