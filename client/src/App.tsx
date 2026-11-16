
import { useEffect, useState, type FormEvent } from "react";
import axios from "axios";
import IssueBookForm from "./IssueBookForm";
import AuthGate from "./AuthGate";
import {
  BookOpen,
  Users,
  Library,
  LayoutDashboard,
  Tags,
  PenTool,
  ClipboardList,
  RefreshCw,
  Plus,
  Search,
  Trash2,
  RotateCcw,
  Menu,
  X,
} from "lucide-react";
import "./index.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

type Item = Record<string, string | number | boolean | null>;

type Field = {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
};

type Resource = {
  key: string;
  title: string;
  endpoint: string;
  icon: typeof BookOpen;
  columns: { key: string; label: string }[];
  fields: Field[];
};

const resources: Resource[] = [
  {
    key: "books",
    title: "Книги",
    endpoint: "books",
    icon: BookOpen,
    columns: [
      { key: "id", label: "ID" },
      { key: "title", label: "Назва" },
      { key: "isbn", label: "ISBN" },
      { key: "publishYear", label: "Рік видання" },
      { key: "authorId", label: "Автор" },
      { key: "categoryId", label: "Категорія" },
    ],
    fields: [
      { name: "title", label: "Назва книги", required: true },
      { name: "isbn", label: "ISBN" },
      { name: "publishYear", label: "Рік видання", type: "number" },
      { name: "description", label: "Опис" },
      { name: "authorId", label: "Автор", type: "author", required: true },
      { name: "categoryId", label: "Категорія", type: "category", required: true },
    ],
  },
  {
    key: "authors",
    title: "Автори",
    endpoint: "authors",
    icon: PenTool,
    columns: [
      { key: "id", label: "ID" },
      { key: "fullName", label: "ПІБ автора" },
      { key: "biography", label: "Біографія" },
    ],
    fields: [
      { name: "fullName", label: "ПІБ автора", required: true },
      { name: "biography", label: "Біографія" },
    ],
  },
  {
    key: "categories",
    title: "Категорії",
    endpoint: "categories",
    icon: Tags,
    columns: [
      { key: "id", label: "ID" },
      { key: "name", label: "Назва категорії" },
    ],
    fields: [
      { name: "name", label: "Назва категорії", required: true },
    ],
  },
  {
    key: "readers",
    title: "Читачі",
    endpoint: "readers",
    icon: Users,
    columns: [
      { key: "id", label: "ID" },
      { key: "fullName", label: "ПІБ" },
      { key: "readerType", label: "Тип" },
      { key: "groupName", label: "Група" },
      { key: "email", label: "Email" },
      { key: "phone", label: "Телефон" },
    ],
    fields: [
      { name: "fullName", label: "ПІБ читача", required: true },
      {
        name: "readerType",
        label: "Тип читача",
        type: "select",
        required: true,
        options: [
          { value: "STUDENT", label: "Студент" },
          { value: "TEACHER", label: "Викладач" },
        ],
      },
      { name: "groupName", label: "Група" },
      { name: "email", label: "Email", type: "email" },
      { name: "phone", label: "Телефон" },
    ],
  },
  {
    key: "copies",
    title: "Примірники",
    endpoint: "copies",
    icon: Library,
    columns: [
      { key: "id", label: "ID" },
      { key: "inventoryNumber", label: "Інвентарний номер" },
      { key: "bookId", label: "Книга" },
      { key: "status", label: "Статус" },
    ],
    fields: [
      { name: "inventoryNumber", label: "Інвентарний номер", required: true },
      { name: "bookId", label: "Книга", type: "book", required: true },
    ],
  },
];

const navItems = [
  { key: "dashboard", label: "Головна", icon: LayoutDashboard },
  ...resources.map((resource) => ({
    key: resource.key,
    label: resource.title,
    icon: resource.icon,
  })),
  { key: "loans", label: "Видача книг", icon: ClipboardList },
];

function LibraryApp() {
  const [page, setPage] = useState("dashboard");
  const [stats, setStats] = useState<Item>({});
  const [items, setItems] = useState<Item[]>([]);
  const [loans, setLoans] = useState<Item[]>([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authors, setAuthors] = useState<Item[]>([]);
  const [categories, setCategories] = useState<Item[]>([]);
  const [books, setBooks] = useState<Item[]>([]);

  const currentResource = resources.find(
    (resource) => resource.key === page,
  );

  async function loadStats() {
    try {
      const response = await axios.get(`${API}/statistics`);
      setStats(response.data);
    } catch {
      setError("Не вдалося завантажити статистику.");
    }
  }

  async function loadItems(resource: Resource) {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(`${API}/${resource.endpoint}`);
      setItems(Array.isArray(response.data) ? response.data : []);
    } catch {
      setItems([]);
      setError("Не вдалося завантажити дані. Перевірте роботу сервера.");
    } finally {
      setLoading(false);
    }
  }

  async function loadLoans() {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get(`${API}/loans`);
      setLoans(Array.isArray(response.data) ? response.data : []);
    } catch {
      setLoans([]);
      setError("Не вдалося завантажити видачі.");
    } finally {
      setLoading(false);
    }
  }

  async function loadRelationOptions() {
    try {
      const [authorsResponse, categoriesResponse, booksResponse] =
        await Promise.all([
          axios.get(`${API}/authors`),
          axios.get(`${API}/categories`),
          axios.get(`${API}/books`),
        ]);

      setAuthors(Array.isArray(authorsResponse.data) ? authorsResponse.data : []);
      setCategories(Array.isArray(categoriesResponse.data) ? categoriesResponse.data : []);
      setBooks(Array.isArray(booksResponse.data) ? booksResponse.data : []);
    } catch {
      setError("Не вдалося завантажити авторів, категорії або книги для списків.");
    }
  }

  useEffect(() => {
    void loadStats();
    void loadRelationOptions();
  }, []);

  useEffect(() => {
    if (currentResource) void loadItems(currentResource);
    if (page === "loans") void loadLoans();

    setSearch("");
    setShowForm(false);
    setEditing(null);
  }, [page]);

  function openCreate() {
    setEditing(null);
    setForm({});
    setShowForm(true);
    setError("");
  }

  function openEdit(item: Item) {
    setEditing(item);

    const values: Record<string, string> = {};

    currentResource?.fields.forEach((field) => {
      values[field.name] = String(item[field.name] ?? "");
    });

    setForm(values);
    setShowForm(true);
    setError("");
  }

  async function saveItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentResource) return;

    const payload: Record<string, string | number | null> = {};

    currentResource.fields.forEach((field) => {
      const value = form[field.name] ?? "";

      if (["number", "author", "category", "book"].includes(field.type || "")) {
        payload[field.name] = value === "" ? null : Number(value);
      } else {
        payload[field.name] =
          value.trim() === "" ? null : value.trim();
      }
    });

    try {
      if (editing) {
        await axios.put(
          `${API}/${currentResource.endpoint}/${editing.id}`,
          payload,
        );
      } else {
        await axios.post(
          `${API}/${currentResource.endpoint}`,
          payload,
        );
      }

      setShowForm(false);
      setEditing(null);

      await loadItems(currentResource);
      await loadRelationOptions();
      await loadStats();
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message
        : null;

      setError(message || "Не вдалося зберегти запис.");
    }
  }

  async function deleteItem(item: Item) {
    if (
      !currentResource ||
      !window.confirm("Ви дійсно хочете видалити цей запис?")
    ) {
      return;
    }

    try {
      await axios.delete(
        `${API}/${currentResource.endpoint}/${item.id}`,
      );

      await loadItems(currentResource);
      await loadStats();
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message
        : null;

      setError(message || "Не вдалося видалити запис.");
    }
  }

  async function returnBook(id: number) {
    if (!window.confirm("Підтвердити повернення книги?")) return;

    try {
      await axios.post(`${API}/loans/${id}/return`);

      await loadLoans();
      await loadStats();
    } catch (err) {
      const message = axios.isAxiosError(err)
        ? err.response?.data?.message
        : null;

      setError(message || "Не вдалося повернути книгу.");
    }
  }

  const filteredItems = items.filter((item) =>
    Object.values(item).some((value) =>
      String(value ?? "").toLowerCase().includes(search.toLowerCase()),
    ),
  );

  function navigate(key: string) {
    setPage(key);
    setSidebarOpen(false);
  }

  const statCards = [
    { label: "Книги", value: stats.books, icon: BookOpen },
    { label: "Читачі", value: stats.readers, icon: Users },
    { label: "Примірники", value: stats.copies, icon: Library },
    { label: "Доступні", value: stats.availableCopies, icon: BookOpen },
    { label: "Активні видачі", value: stats.activeLoans, icon: ClipboardList },
    { label: "Прострочені", value: stats.overdueLoans, icon: RefreshCw },
  ];

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <button
          className="mobile-overlay"
          onClick={() => setSidebarOpen(false)}
          aria-label="Закрити меню"
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-icon">
            <BookOpen size={25} />
          </div>

          <div>
            <strong>Бібліотека</strong>
            <span>Облік фонду коледжу</span>
          </div>

          <button
            className="close-menu"
            onClick={() => setSidebarOpen(false)}
            aria-label="Закрити"
          >
            <X size={20} />
          </button>
        </div>

        <div className="nav-caption">МЕНЮ</div>

        <nav className="navigation">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.key}
                className={`nav-item ${page === item.key ? "active" : ""}`}
                onClick={() => navigate(item.key)}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-avatar">Б</div>
          <div>
            <strong>Бібліотекар</strong>
            <span>Панель керування</span>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button
            className="menu-toggle"
            onClick={() => setSidebarOpen(true)}
            aria-label="Відкрити меню"
          >
            <Menu size={22} />
          </button>

          <div>
            <div className="breadcrumb">
              Бібліотека / {navItems.find((item) => item.key === page)?.label}
            </div>

            <h1>
              {page === "dashboard"
                ? "Головна панель"
                : page === "loans"
                  ? "Видача книг"
                  : currentResource?.title}
            </h1>
          </div>

          <div className="topbar-status">
            <span /> Система активна
          </div>
        </header>

        <div className="content">
          {error && <div className="alert-error">{error}</div>}

          {page === "dashboard" && (
            <>
              <div className="welcome">
                <div>
                  <h2>
                    Вітаємо в системі обліку бібліотечного фонду!
                  </h2>
                  <p>
                    Керуйте книгами, читачами та видачею літератури
                    в одному місці.
                  </p>
                </div>

                <BookOpen className="welcome-icon" size={76} />
              </div>

              <div className="section-heading">
                <div>
                  <h2>Загальна статистика</h2>
                  <p>Поточний стан бібліотечного фонду</p>
                </div>

                <button
                  className="button-secondary"
                  onClick={() => void loadStats()}
                >
                  <RefreshCw size={16} /> Оновити
                </button>
              </div>

              <div className="stats-grid">
                {statCards.map((card) => {
                  const Icon = card.icon;

                  return (
                    <div className="stat-card" key={card.label}>
                      <div className="stat-icon">
                        <Icon size={22} />
                      </div>
                      <div className="stat-label">{card.label}</div>
                      <div className="stat-value">
                        {Number(card.value ?? 0)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="dashboard-bottom">
                <div className="info-panel">
                  <h3>Інформація про систему</h3>
                  <p>
                    Система призначена для автоматизації обліку
                    бібліотечного фонду коледжу.
                  </p>

                  <ul>
                    <li>Ведення електронного каталогу книг</li>
                    <li>Облік читачів та примірників</li>
                    <li>Реєстрація видачі та повернення літератури</li>
                    <li>Контроль прострочених видач</li>
                  </ul>
                </div>

                <div className="info-panel quick-panel">
                  <h3>Швидкий доступ</h3>

                  <button onClick={() => navigate("books")}>
                    <BookOpen size={18} /> Перейти до книг
                  </button>

                  <button onClick={() => navigate("readers")}>
                    <Users size={18} /> Перейти до читачів
                  </button>

                  <button onClick={() => navigate("loans")}>
                    <ClipboardList size={18} /> Облік видачі книг
                  </button>
                </div>
              </div>
            </>
          )}

          {currentResource && (
            <>
              <div className="section-heading">
                <div>
                  <h2>Список: {currentResource.title.toLowerCase()}</h2>
                  <p>Перегляд та керування записами</p>
                </div>

                <button className="button-primary" onClick={openCreate}>
                  <Plus size={17} /> Додати запис
                </button>
              </div>

              <div className="table-toolbar">
                <div className="search-box">
                  <Search size={18} />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Пошук..."
                  />
                </div>

                <span className="record-count">
                  Записів: {filteredItems.length}
                </span>
              </div>

              {showForm && (
                <form className="form-panel" onSubmit={saveItem}>
                  <div className="form-heading">
                    <h3>
                      {editing ? "Редагування запису" : "Новий запис"}
                    </h3>

                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => setShowForm(false)}
                    >
                      <X size={19} />
                    </button>
                  </div>

                  <div className="form-grid">
                    {currentResource.fields.map((field) => (
                      <label className="field" key={field.name}>
                        <span>
                          {field.label}
                          {field.required && " *"}
                        </span>

                        {["select", "author", "category", "book"].includes(field.type || "") ? (
                          <select
                            required={field.required}
                            value={form[field.name] ?? ""}
                            onChange={(event) =>
                              setForm({
                                ...form,
                                [field.name]: event.target.value,
                              })
                            }
                          >
                            <option value="">Оберіть значення</option>

                            {field.type === "author" &&
                              authors.map((author) => (
                                <option key={String(author.id)} value={String(author.id)}>
                                  {String(author.fullName)}
                                </option>
                              ))}
                            {field.type === "category" &&
                              categories.map((category) => (
                                <option key={String(category.id)} value={String(category.id)}>
                                  {String(category.name)}
                                </option>
                              ))}
                            {field.type === "book" &&
                              books.map((book) => (
                                <option key={String(book.id)} value={String(book.id)}>
                                  {String(book.title)}
                                </option>
                              ))}
                            {field.options?.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.type || "text"}
                            required={field.required}
                            value={form[field.name] ?? ""}
                            onChange={(event) =>
                              setForm({
                                ...form,
                                [field.name]: event.target.value,
                              })
                            }
                          />
                        )}
                      </label>
                    ))}
                  </div>

                  <div className="form-actions">
                    <button
                      type="button"
                      className="button-secondary"
                      onClick={() => setShowForm(false)}
                    >
                      Скасувати
                    </button>

                    <button type="submit" className="button-primary">
                      Зберегти
                    </button>
                  </div>
                </form>
              )}

              <div className="table-panel">
                {loading ? (
                  <div className="empty-state">Завантаження...</div>
                ) : filteredItems.length === 0 ? (
                  <div className="empty-state">Записів поки немає</div>
                ) : (
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          {currentResource.columns.map((column) => (
                            <th key={column.key}>{column.label}</th>
                          ))}
                          <th>Дії</th>
                        </tr>
                      </thead>

                      <tbody>
                        {filteredItems.map((item) => (
                          <tr key={String(item.id)}>
                            {currentResource.columns.map((column) => (
                              <td key={column.key}>
                                {column.key === "authorId"
                                  ? String(authors.find((author) => Number(author.id) === Number(item.authorId))?.fullName ?? item.authorId ?? "—")
                                  : column.key === "categoryId"
                                    ? String(categories.find((category) => Number(category.id) === Number(item.categoryId))?.name ?? item.categoryId ?? "—")
                                    : column.key === "bookId"
                                      ? String(books.find((book) => Number(book.id) === Number(item.bookId))?.title ?? item.bookId ?? "—")
                                      : String(item[column.key] ?? "—")}
                              </td>
                            ))}

                            <td>
                              <div className="row-actions">
                                <button
                                  className="edit-button"
                                  onClick={() => openEdit(item)}
                                >
                                  Змінити
                                </button>

                                <button
                                  className="delete-button"
                                  onClick={() => void deleteItem(item)}
                                  aria-label="Видалити"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {page === "loans" && (
            <>
              <div className="section-heading">
                <div>
                  <h2>Історія видачі книг</h2>
                  <p>Активні, повернуті та прострочені видачі</p>
                </div>

                <button
                  className="button-secondary"
                  onClick={() => void loadLoans()}
                >
                  <RefreshCw size={16} /> Оновити
                </button>
              </div>

              <IssueBookForm
                onSuccess={() => {
                  void loadLoans();
                  void loadStats();
                }}
              />

              <div className="table-panel">
                {loading ? (
                  <div className="empty-state">Завантаження...</div>
                ) : loans.length === 0 ? (
                  <div className="empty-state">
                    Записів про видачу поки немає
                  </div>
                ) : (
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Читач</th>
                          <th>Книга</th>
                          <th>Інвентарний номер</th>
                          <th>Дата видачі</th>
                          <th>Повернути до</th>
                          <th>Статус</th>
                          <th>Дії</th>
                        </tr>
                      </thead>

                      <tbody>
                        {loans.map((loan) => {
                          const overdue =
                            loan.status === "ACTIVE" &&
                            new Date(String(loan.dueDate)) < new Date();

                          return (
                            <tr key={String(loan.id)}>
                              <td>{String(loan.id)}</td>
                              <td>{String(loan.readerName ?? loan.readerId)}</td>
                              <td>{String(loan.bookTitle ?? "—")}</td>
                              <td>{String(loan.inventoryNumber ?? "—")}</td>
                              <td>
                                {new Date(
                                  String(loan.issueDate),
                                ).toLocaleDateString("uk-UA")}
                              </td>
                              <td>
                                {new Date(
                                  String(loan.dueDate),
                                ).toLocaleDateString("uk-UA")}
                              </td>
                              <td>
                                <span
                                  className={`status-pill ${
                                    overdue
                                      ? "status-overdue"
                                      : loan.status === "RETURNED"
                                        ? "status-returned"
                                        : "status-active"
                                  }`}
                                >
                                  {overdue
                                    ? "Прострочено"
                                    : loan.status === "RETURNED"
                                      ? "Повернено"
                                      : String(loan.status)}
                                </span>
                              </td>
                              <td>
                                {loan.status === "ACTIVE" ||
                                loan.status === "OVERDUE" ? (
                                  <button
                                    className="return-button"
                                    onClick={() =>
                                      void returnBook(Number(loan.id))
                                    }
                                  >
                                    <RotateCcw size={15} /> Повернути
                                  </button>
                                ) : (
                                  "—"
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthGate>
      <LibraryApp />
    </AuthGate>
  );
}

export default App;
