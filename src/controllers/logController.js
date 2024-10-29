const mysql = require('mysql2');
const createConnection = require("../config/databaseAsync");
// Thiết lập kết nối MySQL
connection = await createConnection();

// Câu lệnh tạo trigger
const triggerQuery = `
CREATE TRIGGER trigger_update_quychuan
AFTER UPDATE ON quychuan
FOR EACH ROW
BEGIN
    DECLARE change_message VARCHAR(255) DEFAULT '';

    -- Kiểm tra cột GiaoVienGiangDay
    IF OLD.GiaoVienGiangDay != NEW.GiaoVienGiangDay THEN
        SET change_message = CONCAT(change_message, 'Giảng Viên giảng dạy cho môn "', NEW.MaHocPhan, '": từ "', OLD.GiaoVienGiangDay, '" thành "', NEW.GiaoVienGiangDay, '". ');
    END IF;

    -- Kiểm tra cột KhoaDuyet
    IF OLD.KhoaDuyet != NEW.KhoaDuyet THEN
        IF OLD.KhoaDuyet = 0 AND NEW.KhoaDuyet = 1 THEN
            SET change_message = CONCAT(change_message, 'Môn "', NEW.MaHocPhan, '": Đã duyệt. ');
        ELSEIF OLD.KhoaDuyet = 1 AND NEW.KhoaDuyet = 0 THEN
            SET change_message = CONCAT(change_message, 'Môn "', NEW.MaHocPhan, '": Hủy duyệt. ');
        END IF;
    END IF;

    -- Kiểm tra cột GiaoVien
    IF OLD.GiaoVien != NEW.GiaoVien THEN
        SET change_message = CONCAT(change_message, 'Giảng viên cho môn "', NEW.MaHocPhan, '": từ "', OLD.GiaoVien, '" thành "', NEW.GiaoVien, '". ');
    END IF;

    -- Nếu có thay đổi, ghi lại thông tin vào bảng lichsunhaplieu
    IF change_message != '' THEN
        INSERT INTO lichsunhaplieu (id_User, TenNhanVien, LoaiThongTin, NoiDungThayDoi, ThoiGianThayDoi)
        VALUES (
            NULL,  -- Để trống id_User
            NULL,  -- Để trống TenNhanVien
            'Thay đổi nhiều cột',  -- Loại thông tin
            change_message,  -- Nội dung mới với thông báo thay đổi
            NOW()  -- Thời gian thay đổi
        );
    END IF;
END;
`;
// Thực thi câu lệnh tạo trigger
connection.query(triggerQuery, (err, results) => {
  if (err) {
    console.error('Lỗi khi tạo trigger:', err);
  } else {
    console.log('Trigger đã được tạo thành công');
  }
  
  // Đóng kết nối
  connection.end();
});
