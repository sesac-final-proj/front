"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BellRing, ChevronLeft, ChevronRight, Copy, GripVertical, Pencil, Save, Search, Trash2, X } from "lucide-react";
import styles from "@/app/admin/admin.module.css";
import {
  AdminNotice,
  AdminNoticePayload,
  AdminNoticeService,
  AdminNoticeStatus,
  createAdminNotice,
  createAdminNoticeAlerts,
  deleteAdminNotice,
  duplicateAdminNotice,
  getAdminNotices,
  reorderAdminNotices,
  updateAdminNotice,
} from "@/services/adminService";

const services = [
  { value: "all", label: "전체" },
  { value: "dream", label: "꿈가지" },
  { value: "carrot", label: "당근" },
];
const statuses = [
  { value: "all", label: "전체" },
  { value: "scheduled", label: "예약" },
  { value: "published", label: "게시중" },
  { value: "ended", label: "종료" },
  { value: "hidden", label: "숨김" },
  { value: "deleted", label: "삭제" },
];
const statusLabel: Record<AdminNoticeStatus, string> = { draft: "작성중", scheduled: "예약", published: "게시중", ended: "종료", hidden: "숨김" };
const serviceLabel: Record<AdminNoticeService, string> = { dream: "꿈가지", carrot: "당근" };
const emptyForm: AdminNoticePayload = { service: "dream", title: "", content: "", starts_at: null, ends_at: null, manual_status: null };

function toLocalInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function fromLocalInput(value: string) {
  return value ? new Date(value).toISOString() : null;
}

export default function NoticesSection() {
  const [items, setItems] = useState<AdminNotice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [service, setService] = useState("all");
  const [status, setStatus] = useState("all");
  const [form, setForm] = useState<AdminNoticePayload>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  // 상세 모달 관련 상태
  const [detailNotice, setDetailNotice] = useState<AdminNotice | null>(null);
  const [isModalEditing, setIsModalEditing] = useState(false);
  const [modalForm, setModalForm] = useState<AdminNoticePayload>(emptyForm);
  const [modalFeedback, setModalFeedback] = useState("");
  const [modalSaving, setModalSaving] = useState(false);

  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [dragId, setDragId] = useState<number | null>(null);
  const size = 10;
  const totalPages = Math.max(1, Math.ceil(total / size));

  const load = useCallback(async (nextPage: number) => {
    setLoading(true);
    try {
      const isDeletedFilter = status === "deleted";
      const data = await getAdminNotices({
        q,
        service,
        status: isDeletedFilter ? "all" : status,
        deleteStatus: isDeletedFilter ? "deleted" : "normal",
        page: nextPage,
        size,
      });
      setItems(data.items);
      setTotal(data.total);
      setPage(nextPage);
      setFeedback("");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "공지 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [q, service, status]);

  useEffect(() => {
    const handle = window.setTimeout(() => load(1), 250);
    return () => window.clearTimeout(handle);
  }, [load]);

  const warningCount = useMemo(() => items.reduce((sum, item) => sum + item.warning_reasons.length, 0), [items]);
  const metricFilterNote = status === "deleted" ? "삭제 공지" : "삭제 제외";

  const edit = (notice: AdminNotice) => {
    setEditingId(notice.id);
    setForm({
      service: notice.service,
      title: notice.title,
      content: notice.content,
      starts_at: toLocalInput(notice.starts_at),
      ends_at: toLocalInput(notice.ends_at),
      manual_status: notice.manual_status === "hidden" ? "hidden" : null,
    });
  };

  const reset = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const submit = async () => {
    const payload = { ...form, starts_at: fromLocalInput(form.starts_at || ""), ends_at: fromLocalInput(form.ends_at || "") };
    try {
      if (editingId) await updateAdminNotice(editingId, payload);
      else await createAdminNotice(payload);
      reset();
      await load(1);
      setFeedback("저장했습니다.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "저장하지 못했습니다.");
    }
  };

  const remove = async (notice: AdminNotice) => {
    if (notice.deleted_at) return;
    if (!window.confirm(`"${notice.title}" 공지를 삭제할까요? 삭제 이력은 보존됩니다.`)) return;
    try {
      await deleteAdminNotice(notice.id);
      await load(Math.min(page, totalPages));
      setFeedback("삭제했습니다.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "삭제하지 못했습니다.");
    }
  };

  const duplicate = async (notice: AdminNotice) => {
    if (notice.deleted_at) return;
    try {
      const copy = await duplicateAdminNotice(notice.id);
      await load(1);
      edit(copy);
      setFeedback("복사본을 만들었습니다.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "복사하지 못했습니다.");
    }
  };

  const createAlerts = async (notice: AdminNotice) => {
    if (notice.deleted_at) return;
    try {
      const result = await createAdminNoticeAlerts(notice.id);
      await load(page);
      setFeedback(result.created_count ? `${result.created_count}명에게 알림을 생성했습니다.` : "이미 생성된 알림입니다.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "알림을 생성하지 못했습니다.");
    }
  };

  const dropOn = async (targetId: number) => {
    if (status === "deleted") return;
    if (!dragId || dragId === targetId) return;
    const moving = items.find((item) => item.id === dragId);
    const target = items.find((item) => item.id === targetId);
    if (!moving || !target || moving.deleted_at || target.deleted_at) return;
    const next = items.filter((item) => item.id !== dragId);
    next.splice(next.findIndex((item) => item.id === targetId), 0, moving);
    setItems(next);
    setDragId(null);
    try {
      await reorderAdminNotices(next.map((item) => item.id));
      await load(page);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "순서를 저장하지 못했습니다.");
    }
  };

  // 상세 모달 제어 함수들
  const openDetailModal = (notice: AdminNotice) => {
    setDetailNotice(notice);
    setIsModalEditing(false);
    setModalFeedback("");
  };

  const closeDetailModal = () => {
    setDetailNotice(null);
    setIsModalEditing(false);
    setModalFeedback("");
  };

  const startModalEdit = () => {
    if (!detailNotice || detailNotice.deleted_at) return;
    setModalForm({
      service: detailNotice.service,
      title: detailNotice.title,
      content: detailNotice.content,
      starts_at: toLocalInput(detailNotice.starts_at),
      ends_at: toLocalInput(detailNotice.ends_at),
      manual_status: detailNotice.manual_status === "hidden" ? "hidden" : null,
    });
    setIsModalEditing(true);
    setModalFeedback("");
  };

  const cancelModalEdit = () => {
    setIsModalEditing(false);
    setModalFeedback("");
  };

  const submitModalEdit = async () => {
    if (!detailNotice) return;
    setModalSaving(true);
    setModalFeedback("");
    const payload = {
      ...modalForm,
      starts_at: fromLocalInput(modalForm.starts_at || ""),
      ends_at: fromLocalInput(modalForm.ends_at || ""),
    };
    try {
      const updated = await updateAdminNotice(detailNotice.id, payload);
      setDetailNotice(updated);
      setIsModalEditing(false);
      setModalFeedback("");
      await load(page);
    } catch (error) {
      setModalFeedback(error instanceof Error ? error.message : "저장하지 못했습니다.");
    } finally {
      setModalSaving(false);
    }
  };

  return <section className={styles.section}>
    <div className={styles.pageHeader}>
      <div>
        <h1>공지 관리</h1>
        <p>검색, 상태 필터, 알림 발행, 소프트 삭제, 정렬 저장을 실제 공지 데이터에 적용합니다.</p>
      </div>
    </div>

    <div className={styles.metrics}>
      <div className={styles.metric}><span>검색 결과</span><strong>{total.toLocaleString()}</strong><small>{metricFilterNote}</small></div>
      <div className={styles.metric}><span>현재 페이지</span><strong>{page} / {totalPages}</strong><small>10개씩 표시</small></div>
      <div className={styles.metric}><span>주의 사유</span><strong>{warningCount}</strong><small>현재 페이지 기준</small></div>
      <div className={styles.metric}><span>알림 생성</span><strong>{items.reduce((sum, item) => sum + item.alert_count, 0).toLocaleString()}</strong><small>현재 페이지 합계</small></div>
    </div>

    <div className={styles.chartGrid}>
      <div className={styles.card}>
        <div className={styles.cardHead}>
          <div><h2>목록</h2><p>검색과 필터는 동시에 적용됩니다. 정상 공지 행을 드래그하면 순서가 저장됩니다.</p></div>
          <div className={styles.filter}><Search size={15} /><input value={q} onChange={(event) => setQ(event.target.value)} placeholder="제목/내용 검색" /></div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
          <select value={service} onChange={(event) => setService(event.target.value)}>
            {services.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
          <select value={status} onChange={(event) => setStatus(event.target.value)}>
            {statuses.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </div>
        <div className={styles.tableScroll}>
          <table className={styles.table}>
            <thead><tr><th>순서</th><th>공지</th><th>서비스</th><th>상태</th><th>기간</th><th>주의</th><th>알림</th><th>작업</th></tr></thead>
            <tbody>
              {items.map((notice) => {
                const isDeleted = Boolean(notice.deleted_at);
                const canDrag = !isDeleted && status !== "deleted";
                return <tr
                  key={notice.id}
                  draggable={canDrag}
                  onDragStart={() => { if (!canDrag) return; setDragId(notice.id); }}
                  onDragOver={(event) => { if (canDrag) event.preventDefault(); }}
                  onDrop={() => { if (canDrag) dropOn(notice.id); }}
                  style={{ opacity: isDeleted ? 0.75 : 1, background: isDeleted ? "#fdfbfb" : undefined }}
                >
                  <td><GripVertical size={16} style={{ opacity: canDrag ? 1 : 0.25 }} /> {notice.display_order}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => openDetailModal(notice)}
                        style={{
                          border: 0,
                          background: "transparent",
                          padding: 0,
                          textAlign: "left",
                          fontWeight: 700,
                          cursor: "pointer",
                          color: "inherit",
                          textDecoration: "underline",
                          textUnderlineOffset: 3,
                        }}
                        title="공지 상세 보기"
                      >
                        {notice.title}
                      </button>
                      {isDeleted && (
                        <span style={{ display: "inline-block", padding: "1px 6px", borderRadius: 4, background: "#FEE2E2", color: "#DC2626", fontSize: 11, fontWeight: 700 }}>
                          삭제됨
                        </span>
                      )}
                    </div>
                  </td>
                  <td>{serviceLabel[notice.service]}</td>
                  <td>{statusLabel[notice.status]}</td>
                  <td>{notice.starts_at ? new Date(notice.starts_at).toLocaleDateString() : "-"} ~ {notice.ends_at ? new Date(notice.ends_at).toLocaleDateString() : "-"}</td>
                  <td>{notice.warning_reasons.length ? notice.warning_reasons.map((reason) => <span key={reason} style={{ display: "inline-block", margin: 2, padding: "3px 6px", borderRadius: 6, background: "#FFF1E8", color: "#a34a14" }}>{reason}</span>) : "-"}</td>
                  <td>{notice.alert_count}</td>
                  <td>
                    <button
                      title={isDeleted ? "삭제된 공지입니다" : "알림 생성"}
                      type="button"
                      onClick={() => createAlerts(notice)}
                      disabled={isDeleted}
                      style={{ opacity: isDeleted ? 0.35 : 1, cursor: isDeleted ? "not-allowed" : "pointer" }}
                    >
                      <BellRing size={15} />
                    </button>
                    <button
                      title={isDeleted ? "삭제된 공지입니다" : "수정"}
                      type="button"
                      onClick={() => edit(notice)}
                      disabled={isDeleted}
                      style={{ opacity: isDeleted ? 0.35 : 1, cursor: isDeleted ? "not-allowed" : "pointer" }}
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      title={isDeleted ? "삭제된 공지입니다" : "복사"}
                      type="button"
                      onClick={() => duplicate(notice)}
                      disabled={isDeleted}
                      style={{ opacity: isDeleted ? 0.35 : 1, cursor: isDeleted ? "not-allowed" : "pointer" }}
                    >
                      <Copy size={15} />
                    </button>
                    <button
                      title={isDeleted ? "이미 삭제된 공지입니다" : "삭제"}
                      type="button"
                      onClick={() => remove(notice)}
                      disabled={isDeleted}
                      style={{ opacity: isDeleted ? 0.35 : 1, cursor: isDeleted ? "not-allowed" : "pointer" }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>;
              })}
              {!items.length && <tr><td colSpan={8}>{loading ? "불러오는 중입니다." : "조건에 맞는 공지가 없습니다."}</td></tr>}
            </tbody>
          </table>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 18 }}>
          <button type="button" disabled={page <= 1} onClick={() => load(page - 1)}><ChevronLeft size={16} />이전</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).slice(0, 7).map((num) => <button key={num} type="button" onClick={() => load(num)} aria-current={num === page ? "page" : undefined}>{num}</button>)}
          <button type="button" disabled={page >= totalPages} onClick={() => load(page + 1)}>다음<ChevronRight size={16} /></button>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardHead}><div><h2>{editingId ? "공지 수정" : "공지 작성"}</h2><p>숨김은 수동 상태로 자동 상태보다 우선합니다.</p></div></div>
        <div className={styles.form} style={{ width: "100%", padding: 0, border: 0 }}>
          <label>서비스<select value={form.service} onChange={(event) => setForm({ ...form, service: event.target.value as AdminNoticeService })}><option value="dream">꿈가지</option><option value="carrot">당근</option></select></label>
          <label>제목<input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} /></label>
          <label>내용<textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} style={{ minHeight: 150, resize: "vertical" }} /></label>
          <label>시작일<input type="datetime-local" value={form.starts_at || ""} onChange={(event) => setForm({ ...form, starts_at: event.target.value })} /></label>
          <label>종료일<input type="datetime-local" value={form.ends_at || ""} onChange={(event) => setForm({ ...form, ends_at: event.target.value })} /></label>
          <label><input type="checkbox" checked={form.manual_status === "hidden"} onChange={(event) => setForm({ ...form, manual_status: event.target.checked ? "hidden" : null })} /> 숨김</label>
          {feedback && <p className={styles.feedback}>{feedback}</p>}
          <button type="button" onClick={submit}><Save size={16} />저장</button>
        </div>
      </div>
    </div>

    {detailNotice && (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.45)",
          zIndex: 1000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
        onClick={closeDetailModal}
      >
        <div
          style={{
            background: "#ffffff",
            color: "#1b1d1b",
            borderRadius: 16,
            width: "100%",
            maxWidth: 620,
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 20px 50px rgba(0, 0, 0, 0.25)",
            padding: 24,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 모달 상단 헤더 */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, borderBottom: "1px solid #E7E8E5", paddingBottom: 16, marginBottom: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{ display: "inline-block", padding: "3px 8px", borderRadius: 6, background: "#f0f2f0", fontSize: 12, fontWeight: 700, color: "#4f554f" }}>
                  {serviceLabel[detailNotice.service]}
                </span>
                <span style={{ display: "inline-block", padding: "3px 8px", borderRadius: 6, background: "#FFF1E8", fontSize: 12, fontWeight: 700, color: "#FF6F0F" }}>
                  {statusLabel[detailNotice.status]}
                </span>
                {detailNotice.deleted_at && (
                  <span style={{ display: "inline-block", padding: "3px 8px", borderRadius: 6, background: "#FEE2E2", fontSize: 12, fontWeight: 700, color: "#DC2626" }}>
                    삭제됨
                  </span>
                )}
              </div>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, wordBreak: "break-all" }}>
                {isModalEditing ? "공지 직접 수정" : detailNotice.title}
              </h2>
            </div>
            <button
              type="button"
              onClick={closeDetailModal}
              style={{ border: 0, background: "transparent", cursor: "pointer", padding: 4, color: "#777" }}
              title="닫기"
            >
              <X size={20} />
            </button>
          </div>

          {isModalEditing ? (
            /* ================= 모달 내 직접 수정 모드 ================= */
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, fontWeight: 700 }}>
                서비스
                <select
                  value={modalForm.service}
                  onChange={(e) => setModalForm({ ...modalForm, service: e.target.value as AdminNoticeService })}
                  style={{ height: 38, padding: "0 10px", borderRadius: 8, border: "1px solid #d8d5ce" }}
                >
                  <option value="dream">꿈가지</option>
                  <option value="carrot">당근</option>
                </select>
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, fontWeight: 700 }}>
                제목
                <input
                  value={modalForm.title}
                  onChange={(e) => setModalForm({ ...modalForm, title: e.target.value })}
                  style={{ height: 38, padding: "0 10px", borderRadius: 8, border: "1px solid #d8d5ce" }}
                  placeholder="공지 제목을 입력하세요"
                />
              </label>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, fontWeight: 700 }}>
                  게시 시작일
                  <input
                    type="datetime-local"
                    value={modalForm.starts_at || ""}
                    onChange={(e) => setModalForm({ ...modalForm, starts_at: e.target.value })}
                    style={{ height: 38, padding: "0 10px", borderRadius: 8, border: "1px solid #d8d5ce" }}
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, fontWeight: 700 }}>
                  게시 종료일
                  <input
                    type="datetime-local"
                    value={modalForm.ends_at || ""}
                    onChange={(e) => setModalForm({ ...modalForm, ends_at: e.target.value })}
                    style={{ height: 38, padding: "0 10px", borderRadius: 8, border: "1px solid #d8d5ce" }}
                  />
                </label>
              </div>

              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={modalForm.manual_status === "hidden"}
                  onChange={(e) => setModalForm({ ...modalForm, manual_status: e.target.checked ? "hidden" : null })}
                />
                수동 숨김 처리
              </label>

              <label style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 12, fontWeight: 700 }}>
                본문 내용
                <textarea
                  value={modalForm.content}
                  onChange={(e) => setModalForm({ ...modalForm, content: e.target.value })}
                  style={{ minHeight: 180, padding: 12, borderRadius: 8, border: "1px solid #d8d5ce", resize: "vertical", fontSize: 14, lineHeight: 1.6 }}
                  placeholder="공지 본문 내용을 입력하세요"
                />
              </label>

              {modalFeedback && (
                <p style={{ margin: 0, padding: "8px 12px", borderRadius: 6, background: "#fff0e8", color: "#b74223", fontSize: 12 }}>
                  {modalFeedback}
                </p>
              )}

              {/* 수정 모드 하단 버튼: 취소 / 저장 */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, borderTop: "1px solid #E7E8E5", paddingTop: 16, marginTop: 6 }}>
                <button
                  type="button"
                  onClick={cancelModalEdit}
                  disabled={modalSaving}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "1px solid #d8d5ce",
                    background: "#fff",
                    color: "#1b1d1b",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={submitModalEdit}
                  disabled={modalSaving}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 18px",
                    borderRadius: 8,
                    border: 0,
                    background: "#FF6F0F",
                    color: "#fff",
                    fontWeight: 700,
                    cursor: modalSaving ? "wait" : "pointer",
                    opacity: modalSaving ? 0.7 : 1,
                  }}
                >
                  <Save size={15} />
                  {modalSaving ? "저장 중..." : "저장"}
                </button>
              </div>
            </div>
          ) : (
            /* ================= 모달 상세보기(읽기) 모드 ================= */
            <div>
              {/* 상단 정보 카드: 서비스, 상태, 알림 생성 수, 등록 일시, 주의 사유, 게시 기간 순 */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 16px", fontSize: 13, background: "#F7F7F5", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <div><span style={{ color: "#777d72", fontWeight: 600 }}>서비스:</span> <strong>{serviceLabel[detailNotice.service]}</strong></div>
                <div><span style={{ color: "#777d72", fontWeight: 600 }}>상태:</span> <strong>{statusLabel[detailNotice.status]}{detailNotice.manual_status === "hidden" ? " (수동 숨김)" : ""}</strong></div>
                <div><span style={{ color: "#777d72", fontWeight: 600 }}>알림 생성 수:</span> <strong>{detailNotice.alert_count}건</strong></div>
                <div><span style={{ color: "#777d72", fontWeight: 600 }}>등록 일시:</span> <span>{detailNotice.created_at ? new Date(detailNotice.created_at).toLocaleString() : "-"}</span></div>

                <div style={{ gridColumn: "span 2" }}>
                  <span style={{ color: "#777d72", fontWeight: 600 }}>주의 사유:</span>{" "}
                  {detailNotice.warning_reasons.length ? (
                    detailNotice.warning_reasons.map((reason) => (
                      <span key={reason} style={{ display: "inline-block", margin: "2px 4px", padding: "2px 6px", borderRadius: 4, background: "#FFF1E8", color: "#a34a14", fontSize: 11, fontWeight: 700 }}>
                        {reason}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: "#22c55e", fontWeight: 600 }}>정상 (주의 사유 없음)</span>
                  )}
                </div>

                <div style={{ gridColumn: "span 2" }}>
                  <span style={{ color: "#777d72", fontWeight: 600 }}>게시 기간:</span>{" "}
                  <strong>
                    {detailNotice.starts_at ? new Date(detailNotice.starts_at).toLocaleString() : "시작일 미지정"}
                    {" ~ "}
                    {detailNotice.ends_at ? new Date(detailNotice.ends_at).toLocaleString() : "종료일 미지정"}
                  </strong>
                </div>

                {detailNotice.deleted_at && (
                  <div style={{ gridColumn: "span 2" }}>
                    <span style={{ color: "#DC2626", fontWeight: 600 }}>삭제 일시:</span>{" "}
                    <span style={{ color: "#DC2626", fontWeight: 700 }}>{new Date(detailNotice.deleted_at).toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* 본문 전체 */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#4f554f", marginBottom: 8 }}>본문 내용</div>
                <div
                  style={{
                    border: "1px solid #E7E8E5",
                    borderRadius: 10,
                    padding: 14,
                    background: "#ffffff",
                    fontSize: 14,
                    lineHeight: 1.6,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    maxHeight: 240,
                    overflowY: "auto",
                  }}
                >
                  {detailNotice.content}
                </div>
              </div>

              {/* 본문 아래 수정 이력 섹션 */}
              <div style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid #E7E8E5", marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#4f554f", marginBottom: 6 }}>수정 이력</div>
                <div style={{ fontSize: 12, color: "#777d72" }}>
                  최근 수정 일시: <strong style={{ color: "#1b1d1b" }}>{detailNotice.updated_at ? new Date(detailNotice.updated_at).toLocaleString() : "-"}</strong>
                </div>
              </div>

              {/* 하단 버튼: 닫기 / 수정하기 */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, borderTop: "1px solid #E7E8E5", paddingTop: 16 }}>
                <button
                  type="button"
                  onClick={closeDetailModal}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "1px solid #d8d5ce",
                    background: "#fff",
                    color: "#1b1d1b",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  닫기
                </button>
                <button
                  type="button"
                  disabled={Boolean(detailNotice.deleted_at)}
                  onClick={startModalEdit}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: 0,
                    background: detailNotice.deleted_at ? "#ccc" : "#FF6F0F",
                    color: "#fff",
                    fontWeight: 700,
                    cursor: detailNotice.deleted_at ? "not-allowed" : "pointer",
                  }}
                  title={detailNotice.deleted_at ? "삭제된 공지는 수정할 수 없습니다" : "상세 모달 내에서 직접 수정하기"}
                >
                  <Pencil size={15} />
                  수정하기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )}
  </section>;
}
