# Album Ảnh Cưới

Web xem ảnh cưới với nhiều hiệu ứng, lấy ảnh **trực tiếp từ Google Drive**.
Chỉ cần upload ảnh lên Drive → web tự hiển thị, không cần sửa code hay deploy lại.

## Tính năng

- **Nhóm / album theo thư mục Drive**, lồng bao nhiêu cấp cũng được (vd: `Lễ cưới 25/10 › Cô dâu`).
- **Giao diện thiệp cưới**: tên cô dâu & chú rể viết tay, ảnh bìa khung vòm, cành lá mint trang trí.
- **7 bố cục**: Hàng đều, Tạp chí, So le, Dây treo ảnh, Băng phim, Polaroid, Lưới vuông.
- **10 hiệu ứng chuyển ảnh**: Ken Burns, Hoà tan, Mở hình trái tim, Vòng tròn lan, Rèm cửa, Thả rơi, Trượt ngang, Phóng nhẹ, Mơ màng, Lật trang sách — hoặc **Ngẫu nhiên**. Ảnh chỉ chuyển khi đã tải xong nên không bị giật.
- **Trình chiếu** một album, hoặc **trình chiếu tất cả** ảnh trong một nhóm; chỉnh thời gian 3–12 giây/ảnh.
- Toàn màn hình, dải ảnh nhỏ, vuốt trên điện thoại, phím tắt (`←` `→` `Space` `F` `Esc`).
- **Chọn ảnh bìa bằng ♥**: rê chuột lên ảnh (hoặc trong trình xem ảnh) bấm ♥ để ảnh đó làm ảnh bìa album. Lựa chọn này lưu trong trình duyệt của bạn. Để **mọi người** đều thấy, đổi tên file trên Drive bắt đầu bằng `cover` hoặc `bia` (vd `cover.jpg`).
- Trang trí nền: trái tim / cánh hoa / lá mint / lấp lánh; tim bay theo chuột và bung ra khi bấm.
- Đặt tên file ảnh có nghĩa (vd `Cô dâu tung hoa.jpg`) để hiện chú thích ở bố cục Dây treo ảnh / Polaroid.
- Tải ảnh gốc / mở trên Drive. Có link riêng cho từng album để chia sẻ.
- Dữ liệu được làm mới sau 5 phút, hoặc bấm nút ⟳ để tải ngay.

## Cách sắp xếp thư mục trên Google Drive

```
📁 Đám cưới A & B             ← thư mục gốc (tên này là tiêu đề trang chủ)
├── 📁 01. Lễ ăn hỏi 21/10    ← nhóm
│   ├── 📁 01. Cô dâu         ← album
│   ├── 📁 02. Chú rể
│   ├── 📁 03. Họ hàng
│   └── 📁 04. Bạn bè
├── 📁 02. Lễ cưới 25/10
│   ├── 📁 01. Cô dâu
│   └── ...
└── 📁 03. Ảnh studio          ← có thể chứa ảnh trực tiếp
```

- Tiền tố số `01. ` dùng để **sắp thứ tự** và sẽ được **ẩn** khi hiển thị.
- Ảnh trong album sắp theo tên file.
- Thêm thư mục / ảnh mới bất cứ lúc nào — web tự nhận.

## Cài đặt

### 1. Chia sẻ thư mục gốc

Trên Google Drive: chuột phải thư mục gốc → **Chia sẻ** → *Quyền truy cập chung*:
**Bất kỳ ai có đường liên kết** – vai trò **Người xem**.
(Thư mục con và ảnh bên trong tự kế thừa quyền này.)

Lấy **ID thư mục** từ URL: `https://drive.google.com/drive/folders/`**`1AbCdEf...`**

### 2. Tạo API key

1. Vào <https://console.cloud.google.com/> → tạo project mới.
2. **APIs & Services → Library** → tìm **Google Drive API** → **Enable**.
3. **APIs & Services → Credentials → Create credentials → API key**.
4. Nên bấm **Edit API key** để giới hạn:
   - *Application restrictions*: **Websites** → thêm `http://localhost:5173/*` và tên miền của bạn (vd `https://album-cua-toi.vercel.app/*`).
   - *API restrictions*: chỉ chọn **Google Drive API**.

> API key nằm trong code phía trình duyệt nên ai cũng xem được — vì vậy cần giới hạn như trên.
> Key này chỉ đọc được những thư mục đã chia sẻ công khai.

### 3. Cấu hình & chạy

```bash
cp .env.example .env      # rồi điền VITE_GOOGLE_API_KEY và VITE_DRIVE_ROOT_FOLDER_ID
npm install
npm run dev               # mở http://localhost:5173
```

Chưa điền `.env` thì web chạy ở **chế độ demo** với ảnh mẫu.

Tên thư mục gốc dạng `Đám cưới A & B` sẽ được tách thành tên cô dâu/chú rể trên trang chủ.
Thêm `VITE_WEDDING_DATE=25 . 10 . 2026` vào `.env` để hiện ngày cưới.

### 4. Đưa lên mạng

```bash
npm run build             # tạo thư mục dist/ (web tĩnh)
```

Deploy `dist/` lên **Vercel**, **Netlify**, **Cloudflare Pages** hoặc **GitHub Pages**.
Trên Vercel/Netlify: khai báo 2 biến `VITE_GOOGLE_API_KEY`, `VITE_DRIVE_ROOT_FOLDER_ID` trong phần Environment Variables,
build command `npm run build`, output `dist`.

## Cấu trúc code

| File | Vai trò |
| --- | --- |
| `src/lib/drive.ts` | Gọi Google Drive API, cache, dữ liệu demo |
| `src/lib/settings.ts` | Bố cục / hiệu ứng / thời gian (lưu trong trình duyệt) |
| `src/components/Lightbox.tsx` | Trình xem ảnh & trình chiếu |
| `src/components/Gallery.tsx` | Lưới ảnh 3 bố cục |
| `src/components/FolderCard.tsx` | Thẻ album |
| `src/styles.css` | Giao diện và toàn bộ hiệu ứng (keyframes `fx-*`) |

Muốn thêm hiệu ứng mới: thêm vào `EFFECTS` trong `settings.ts` và viết CSS `.fx-<tên> .enter` / `.fx-<tên> .leave` trong `styles.css`.

## Lưu ý

- Ảnh hiển thị qua máy chủ ảnh của Google nên tải nhanh và tự thu nhỏ theo kích thước màn hình.
- Định dạng HEIC (iPhone) Google Drive vẫn tạo ảnh xem trước được, nhưng nên dùng JPG cho chắc chắn.
- Drive API miễn phí với hạn mức rất lớn, dư cho album gia đình.
