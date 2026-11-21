import Link from "next/link";
import styles from "@/styles/Admin.module.css";

export default function AdminTable({ columns, rows, rowKey, emptyText }) {
  return (
    <div className={styles.tableCard}>
      <div className={styles.tableScroll}>
        <table className={styles.dataTable}>
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key} className={col.align === "right" ? styles.thRight : ""}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {!rows.length ? (
              <tr>
                <td colSpan={columns.length} className={styles.tdEmpty}>
                  {emptyText || "Belum ada data."}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={rowKey(row)}>
                  {columns.map((col) => {
                    const value = col.render ? col.render(row) : row[col.key];
                    return (
                      <td
                        key={col.key}
                        className={`${col.align === "right" ? styles.tdRight : ""} ${col.mono ? styles.tdMono : ""}`}
                      >
                        {typeof value === "string" && value.startsWith("__LINK__:") ? (
                          <Link href={value.replace("__LINK__:", "")} className={styles.inlineLink}>
                            Buka
                          </Link>
                        ) : (
                          value
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

