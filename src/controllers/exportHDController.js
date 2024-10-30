const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const fs = require('fs');
const path = require('path');
const createConnection = require('../config/databaseAsync');

// Hàm chuyển đổi số thành chữ (ví dụ đơn giản)
const numberToWords = (num) => {
    if (num === 0) return 'không đồng';

    const ones = [
        '', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'
    ];
    const teens = [
        'mười', 'mười một', 'mười hai', 'mười ba', 'mười bốn', 'mười lăm', 
        'mười sáu', 'mười bảy', 'mười tám', 'mười chín'
    ];
    const tens = [
        '', '', 'hai mươi', 'ba mươi', 'bốn mươi', 'năm mươi', 
        'sáu mươi', 'bảy mươi', 'tám mươi', 'chín mươi'
    ];
    const thousands = [
        '', 'nghìn', 'triệu', 'tỷ'
    ];

    let words = '';
    let unitIndex = 0;

    // Chia số thành từng phần 3 chữ số (như triệu, nghìn, đơn vị)
    while (num > 0) {
        const chunk = num % 1000;
        if (chunk) {
            const chunkWords = [];
            const hundreds = Math.floor(chunk / 100);
            const remainder = chunk % 100;

            // Xử lý hàng trăm
            if (hundreds) {
                chunkWords.push(ones[hundreds]);
                chunkWords.push('trăm');
            }

            // Xử lý hàng chục
            if (remainder < 10) {
                chunkWords.push(ones[remainder]);
            } else if (remainder < 20) {
                chunkWords.push(teens[remainder - 10]);
            } else {
                const tenPlace = Math.floor(remainder / 10);
                const onePlace = remainder % 10;

                chunkWords.push(tens[tenPlace]);
                if (onePlace === 1 && tenPlace > 0) {
                    chunkWords.push('mốt'); // Xử lý đặc biệt cho "một"
                } else if (onePlace) {
                    chunkWords.push(ones[onePlace]);
                }
            }

            // Thêm đơn vị (nghìn, triệu, tỷ)
            chunkWords.push(thousands[unitIndex]);
            words = chunkWords.join(' ') + ' ' + words;
        }
        num = Math.floor(num / 1000);
        unitIndex++;
    }

    return words.trim() + ' đồng';
};

const numberWithDecimalToWords = (num) => {
    // Tách phần nguyên và phần thập phân
    const [integerPart, decimalPart] = num.toString().split('.');

    const integerWords = numberToWords(parseInt(integerPart, 10));
    let decimalWords = '';

    // Nếu có phần thập phân
    if (decimalPart) {
        decimalWords = 'phẩy ' + decimalPart.split('').map(digit => ones[parseInt(digit)]).join(' ');
    }

    return `${integerWords}${decimalWords ? ' ' + decimalWords : ''}`.trim();
};


const formatDate = (date) => {
    try {
        if (!date) return '';
        const d = new Date(date);
        if (isNaN(d.getTime())) return '';
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    } catch (error) {
        console.error("Error formatting date:", error);
        return '';
    }
};

const exportHDController = async (req, res) => {
    let connection;
    try {
        if (!req.query.teacherName) {
            return res.status(400).send('Thiếu thông tin giảng viên');
        }

        connection = await createConnection();
        console.log("Querying for teacher:", req.query.teacherName);

        const [contractData] = await connection.execute(
            `SELECT * FROM hopdonggvmoi WHERE HoTen = ?`, 
            [req.query.teacherName]
        );

        if (!contractData || contractData.length === 0) {
            return res.status(404).send('Không tìm thấy hợp đồng của giảng viên.');
        }

        const contract = contractData[0];
        
        // Tính toán các giá trị tiền
        const soTiet = contract.SoTiet || 0;
        const tienText = soTiet * 100000;
        const tienThueText = Math.round(tienText * 0.1); // Tính thuế 10% của Tiền text
        const tienThucNhanText = tienText - tienThueText; // Tính Tiền thực nhận

        // Chuẩn bị dữ liệu cho mẫu
        const data = {
            'Ngày_bắt_đầu': formatDate(contract.NgayBatDau),
            'Ngày_kết_thúc': formatDate(contract.NgayKetThuc),
            'Danh_xưng': contract.DanhXung,
            'Họ_và_tên': contract.HoTen,
            'CCCD': contract.CCCD,
            'Ngày_cấp': formatDate(contract.NgayCap),
            'Nơi_cấp': contract.NoiCapCCCD,
            'Chức_vụ': contract.ChucVu,
            'Cấp_bậc': contract.HocVi,
            'Hệ_số_lương': contract.HSL,
            'Địa_chỉ_theo_CCCD': contract.DiaChi,
            'Điện_thoại': contract.DienThoai,
            'Mã_số_thuế': contract.MaSoThue,
            'Số_tài_khoản': contract.STK,
            'Email': contract.Email,
            'Tại_ngân_hàng': contract.NganHang,
            'Số_tiết': contract.SoTiet,
            'Ngày_kí_hợp_đồng': formatDate(contract.NgayKi),
            'Tiền_text': tienText.toLocaleString('vi-VN'),
            'Bằng_chữ_số_tiền': numberToWords(tienText),
            'Tiền_thuế_Text': tienThueText.toLocaleString('vi-VN'),
            'Tiền_thực_nhận_Text': tienThucNhanText.toLocaleString('vi-VN'),
            'Bằng_chữ_của_thực_nhận': numberToWords(tienThucNhanText),
        };

        console.log("Data for template:", data);

        const templatePath = path.resolve(__dirname, '../templates/HopDong.docx');
        if (!fs.existsSync(templatePath)) {
            throw new Error('Template file not found');
        }

        const content = fs.readFileSync(templatePath, 'binary');
        const zip = new PizZip(content);

        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
            delimiters: {
                start: '«',
                end: '»'
            }
        });

        try {
            console.log("Attempting to render document with data");
            doc.render(data);
        } catch (error) {
            console.error("Error rendering template:", {
                message: error.message,
                name: error.name,
                stack: error.stack,
                properties: error.properties
            });

            if (error.properties && error.properties.errors instanceof Array) {
                const errorMessages = error.properties.errors.map(function (error) {
                    return error.properties.explanation;
                }).join("\n");
                console.log('Detailed error messages: \n', errorMessages);
            }

            throw new Error('Lỗi khi tạo file hợp đồng: ' + error.message);
        }

        const buf = doc.getZip().generate({
            type: 'nodebuffer',
            compression: 'DEFLATE'
        });

        const exportDir = path.join(__dirname, '..', 'public', 'exports');
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }

        const fileName = `HopDong_${contract.HoTen}_${Date.now()}.docx`;
        const outputPath = path.join(exportDir, fileName);
        
        fs.writeFileSync(outputPath, buf);
        console.log(`File saved at: ${outputPath}`);

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        res.setHeader('Content-Disposition', `attachment; filename=${encodeURIComponent(fileName)}`);

        res.download(outputPath, fileName, (err) => {
            if (fs.existsSync(outputPath)) {
                fs.unlinkSync(outputPath);
            }
            
            if (err) {
                console.error("Error sending file:", err);
            }
        });

    } catch (error) {
        console.error("Error in exportHDController:", error);
        res.status(500).send(`Lỗi khi tạo file hợp đồng: ${error.message}`);
    } finally {
        if (connection) {
            try {
                await connection.end();
            } catch (error) {
                console.error("Error closing database connection:", error);
            }
        }
    }
};

module.exports = exportHDController;
