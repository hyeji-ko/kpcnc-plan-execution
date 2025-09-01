// 전사 신기술 세미나 실행계획 웹앱 메인 JavaScript

class SeminarPlanningApp {
    constructor() {
        this.currentData = {
            objective: '',
            datetime: '',
            location: '',
            attendees: '',
            timeSchedule: [],
            attendeeList: []
        };
        
        this.currentDocumentId = null; // Firebase 문서 ID 저장
        
        this.init();
    }

    async init() {
        this.bindEvents();
        this.updateFirebaseStatus(); // Firebase 상태 표시
        await this.loadInitialData();
        this.addDefaultRows();
    }

    bindEvents() {
        // 저장 버튼
        document.getElementById('saveBtn').addEventListener('click', () => this.saveData());
        
        // 불러오기 버튼
        document.getElementById('loadBtn').addEventListener('click', () => this.loadData());
        
        // 시간 계획 행 추가
        document.getElementById('addTimeRow').addEventListener('click', () => this.addTimeRow());
        
        // 참석자 행 추가
        document.getElementById('addAttendeeRow').addEventListener('click', () => this.addAttendeeRow());
        
        // 내보내기 버튼들
        document.getElementById('exportPDF').addEventListener('click', () => this.exportToPDF());
        document.getElementById('exportExcel').addEventListener('click', () => this.exportToExcel());
        document.getElementById('exportWord').addEventListener('click', () => this.exportToWord());
        
        // 입력 필드 변경 감지
        this.bindInputEvents();
    }

    bindInputEvents() {
        // 기본 정보 입력 필드들
        const basicFields = ['objective', 'datetime', 'location', 'attendees'];
        basicFields.forEach(field => {
            const element = document.getElementById(field);
            if (element) {
                element.addEventListener('input', (e) => {
                    this.currentData[field] = e.target.value;
                });
            }
        });
    }

    async loadInitialData() {
        try {
            // Firebase에서 저장된 데이터 불러오기
            const result = await loadData();
            if (result.success) {
                this.currentData = result.data;
                this.currentDocumentId = result.id; // Firebase 문서 ID 저장
                this.populateForm();
                console.log('Firebase에서 데이터를 성공적으로 불러왔습니다.');
            } else {
                console.log('저장된 데이터가 없습니다:', result.message);
            }
        } catch (error) {
            console.error('초기 데이터 로드 오류:', error);
        }
    }

    populateForm() {
        // 기본 정보 채우기
        Object.keys(this.currentData).forEach(key => {
            const element = document.getElementById(key);
            if (element && typeof this.currentData[key] === 'string') {
                element.value = this.currentData[key];
            }
        });

        // 시간 계획 테이블 채우기
        this.populateTimeTable();
        
        // 참석자 테이블 채우기
        this.populateAttendeeTable();
    }

    addDefaultRows() {
        // 기본 시간 계획 행 추가
        if (this.currentData.timeSchedule.length === 0) {
            this.addTimeRow();
        }
        
        // 기본 참석자 행 추가
        if (this.currentData.attendeeList.length === 0) {
            this.addAttendeeRow();
        }
    }

    addTimeRow() {
        const tbody = document.getElementById('timeTableBody');
        const rowCount = tbody.children.length;
        
        const row = document.createElement('tr');
        row.className = 'table-row-hover';
        row.innerHTML = `
            <td class="px-4 py-3 border-b">
                <select class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" onchange="app.updateTimeSchedule(${rowCount}, 'type', this.value)">
                    <option value="">선택</option>
                    <option value="발표">발표</option>
                    <option value="토의">토의</option>
                    <option value="정리">정리</option>
                    <option value="석식">석식</option>
                    <option value="보고">보고</option>
                </select>
            </td>
            <td class="px-4 py-3 border-b">
                <input type="text" class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                       placeholder="주요 내용을 입력하세요" 
                       onchange="app.updateTimeSchedule(${rowCount}, 'content', this.value)">
            </td>
            <td class="px-4 py-3 border-b">
                <input type="time" class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                       onchange="app.updateTimeSchedule(${rowCount}, 'time', this.value)">
            </td>
            <td class="px-4 py-3 border-b">
                <input type="text" class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                       placeholder="담당자를 입력하세요" 
                       onchange="app.updateTimeSchedule(${rowCount}, 'responsible', this.value)">
            </td>
            <td class="px-4 py-3 border-b">
                <button onclick="app.removeTimeRow(${rowCount})" class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm transition-colors duration-200">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
        
        // 데이터 구조에 새 행 추가
        this.currentData.timeSchedule[rowCount] = {
            type: '',
            content: '',
            time: '',
            responsible: ''
        };
    }

    addAttendeeRow() {
        const tbody = document.getElementById('attendeeTableBody');
        const rowCount = tbody.children.length;
        
        const row = document.createElement('tr');
        row.className = 'table-row-hover';
        row.innerHTML = `
            <td class="px-4 py-3 border-b text-center">${rowCount + 1}</td>
            <td class="px-4 py-3 border-b">
                <input type="text" class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                       placeholder="성명을 입력하세요" 
                       onchange="app.updateAttendeeList(${rowCount}, 'name', this.value)">
            </td>
            <td class="px-4 py-3 border-b">
                <input type="text" class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                       placeholder="직급을 입력하세요" 
                       onchange="app.updateAttendeeList(${rowCount}, 'position', this.value)">
            </td>
            <td class="px-4 py-3 border-b">
                <input type="text" class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                       placeholder="소속을 입력하세요" 
                       onchange="app.updateAttendeeList(${rowCount}, 'department', this.value)">
            </td>
            <td class="px-4 py-3 border-b">
                <input type="text" class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                       placeholder="업무를 입력하세요" 
                       onchange="app.updateAttendeeList(${rowCount}, 'work', this.value)">
            </td>
            <td class="px-4 py-3 border-b">
                <button onclick="app.removeAttendeeRow(${rowCount})" class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm transition-colors duration-200">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
        
        // 데이터 구조에 새 행 추가
        this.currentData.attendeeList[rowCount] = {
            name: '',
            position: '',
            department: '',
            work: ''
        };
    }

    updateTimeSchedule(index, field, value) {
        if (this.currentData.timeSchedule[index]) {
            this.currentData.timeSchedule[index][field] = value;
        }
    }

    updateAttendeeList(index, field, value) {
        if (this.currentData.attendeeList[index]) {
            this.currentData.attendeeList[index][field] = value;
        }
    }

    removeTimeRow(index) {
        const tbody = document.getElementById('timeTableBody');
        if (tbody.children.length > 1) {
            tbody.children[index].remove();
            this.currentData.timeSchedule.splice(index, 1);
            this.reorderTimeRows();
        }
    }

    removeAttendeeRow(index) {
        const tbody = document.getElementById('attendeeTableBody');
        if (tbody.children.length > 1) {
            tbody.children[index].remove();
            this.currentData.attendeeList.splice(index, 1);
            this.reorderAttendeeRows();
        }
    }

    reorderTimeRows() {
        const tbody = document.getElementById('timeTableBody');
        Array.from(tbody.children).forEach((row, index) => {
            const inputs = row.querySelectorAll('input, select');
            inputs.forEach(input => {
                input.onchange = (e) => {
                    this.updateTimeSchedule(index, this.getFieldName(input), e.target.value);
                };
            });
            
            const deleteBtn = row.querySelector('button');
            deleteBtn.onclick = () => this.removeTimeRow(index);
        });
    }

    reorderAttendeeRows() {
        const tbody = document.getElementById('attendeeTableBody');
        Array.from(tbody.children).forEach((row, index) => {
            // 번호 업데이트
            const numberCell = row.children[0];
            numberCell.textContent = index + 1;
            
            const inputs = row.querySelectorAll('input');
            inputs.forEach(input => {
                input.onchange = (e) => {
                    this.updateAttendeeList(index, this.getFieldName(input), e.target.value);
                };
            });
            
            const deleteBtn = row.querySelector('button');
            deleteBtn.onclick = () => this.removeAttendeeRow(index);
        });
    }

    getFieldName(input) {
        const placeholder = input.placeholder;
        if (placeholder.includes('성명')) return 'name';
        if (placeholder.includes('직급')) return 'position';
        if (placeholder.includes('소속')) return 'department';
        if (placeholder.includes('업무')) return 'work';
        if (placeholder.includes('주요 내용')) return 'content';
        if (placeholder.includes('담당자')) return 'responsible';
        return '';
    }

    populateTimeTable() {
        const tbody = document.getElementById('timeTableBody');
        tbody.innerHTML = '';
        
        this.currentData.timeSchedule.forEach((item, index) => {
            this.addTimeRow();
            // 데이터 채우기
            const row = tbody.children[index];
            const inputs = row.querySelectorAll('input, select');
            if (inputs[0]) inputs[0].value = item.type || '';
            if (inputs[1]) inputs[1].value = item.content || '';
            if (inputs[2]) inputs[2].value = item.time || '';
            if (inputs[3]) inputs[3].value = item.responsible || '';
        });
    }

    populateAttendeeTable() {
        const tbody = document.getElementById('attendeeTableBody');
        tbody.innerHTML = '';
        
        this.currentData.attendeeList.forEach((item, index) => {
            this.addAttendeeRow();
            // 데이터 채우기
            const row = tbody.children[index];
            const inputs = row.querySelectorAll('input');
            if (inputs[0]) inputs[0].value = item.name || '';
            if (inputs[1]) inputs[1].value = item.position || '';
            if (inputs[2]) inputs[2].value = item.department || '';
            if (inputs[3]) inputs[3].value = item.work || '';
        });
    }

    async saveData() {
        try {
            this.showLoading(true);
            
            // 현재 폼 데이터 수집
            this.collectFormData();
            
            let result;
            if (this.currentDocumentId) {
                // 기존 문서 업데이트
                result = await updateData(this.currentDocumentId, this.currentData);
            } else {
                // 새 문서 생성
                result = await saveData(this.currentData);
                if (result.success && result.id) {
                    this.currentDocumentId = result.id; // 새로 생성된 문서 ID 저장
                }
            }
            
            if (result.success) {
                this.showSuccessToast(result.message);
            } else {
                this.showErrorToast(result.message);
            }
        } catch (error) {
            console.error('저장 오류:', error);
            this.showErrorToast('저장 중 오류가 발생했습니다.');
        } finally {
            this.showLoading(false);
        }
    }

    async loadData() {
        try {
            this.showLoading(true);
            
            const result = await loadData();
            
            if (result.success) {
                this.currentData = result.data;
                this.currentDocumentId = result.id; // Firebase 문서 ID 저장
                this.populateForm();
                this.showSuccessToast('Firebase에서 데이터를 성공적으로 불러왔습니다.');
            } else {
                this.showErrorToast(result.message);
            }
        } catch (error) {
            console.error('불러오기 오류:', error);
            this.showErrorToast('데이터 불러오기 중 오류가 발생했습니다.');
        } finally {
            this.showLoading(false);
        }
    }

    collectFormData() {
        // 기본 정보 수집
        this.currentData.objective = document.getElementById('objective').value;
        this.currentData.datetime = document.getElementById('datetime').value;
        this.currentData.location = document.getElementById('location').value;
        this.currentData.attendees = document.getElementById('attendees').value;
        
        // 시간 계획 데이터 수집
        const timeRows = document.getElementById('timeTableBody').children;
        this.currentData.timeSchedule = [];
        
        Array.from(timeRows).forEach(row => {
            const inputs = row.querySelectorAll('input, select');
            this.currentData.timeSchedule.push({
                type: inputs[0]?.value || '',
                content: inputs[1]?.value || '',
                time: inputs[2]?.value || '',
                responsible: inputs[3]?.value || ''
            });
        });
        
        // 참석자 데이터 수집
        const attendeeRows = document.getElementById('attendeeTableBody').children;
        this.currentData.attendeeList = [];
        
        Array.from(attendeeRows).forEach(row => {
            const inputs = row.querySelectorAll('input');
            this.currentData.attendeeList.push({
                name: inputs[0]?.value || '',
                position: inputs[1]?.value || '',
                department: inputs[2]?.value || '',
                work: inputs[3]?.value || ''
            });
        });
    }

    showLoading(show) {
        const spinner = document.getElementById('loadingSpinner');
        if (show) {
            spinner.classList.remove('hidden');
        } else {
            spinner.classList.add('hidden');
        }
    }

    showSuccessToast(message) {
        const toast = document.getElementById('successToast');
        const messageSpan = toast.querySelector('span');
        messageSpan.textContent = message;
        
        toast.classList.remove('translate-x-full');
        toast.classList.add('slide-in-right');
        
        setTimeout(() => {
            toast.classList.add('translate-x-full');
        }, 3000);
    }

    showErrorToast(message) {
        // 에러 토스트는 성공 토스트를 재사용하여 표시
        const toast = document.getElementById('successToast');
        const messageSpan = toast.querySelector('span');
        const icon = toast.querySelector('i');
        
        messageSpan.textContent = message;
        icon.className = 'fas fa-exclamation-circle mr-2';
        toast.classList.remove('bg-green-500');
        toast.classList.add('bg-red-500');
        
        toast.classList.remove('translate-x-full');
        toast.classList.add('slide-in-right');
        
        setTimeout(() => {
            toast.classList.add('translate-x-full');
            // 원래 스타일로 복원
            icon.className = 'fas fa-check-circle mr-2';
            toast.classList.remove('bg-red-500');
            toast.classList.add('bg-green-500');
        }, 3000);
    }

    // Firebase 연결 상태 확인
    checkFirebaseConnection() {
        try {
            if (typeof firebase !== 'undefined' && firebase.app) {
                const app = firebase.app();
                console.log('Firebase 연결 상태: 정상', app.name);
                return true;
            } else {
                console.error('Firebase가 로드되지 않았습니다.');
                return false;
            }
        } catch (error) {
            console.error('Firebase 연결 확인 오류:', error);
            return false;
        }
    }

    // Firebase 상태를 헤더에 표시
    updateFirebaseStatus() {
        const isConnected = this.checkFirebaseConnection();
        const header = document.querySelector('header');
        
        // 기존 상태 표시 제거
        const existingStatus = header.querySelector('.firebase-status');
        if (existingStatus) {
            existingStatus.remove();
        }
        
        // 상태 표시 추가
        const statusDiv = document.createElement('div');
        statusDiv.className = 'firebase-status flex items-center space-x-2';
        
        const statusIcon = document.createElement('i');
        statusIcon.className = isConnected ? 'fas fa-database text-green-500' : 'fas fa-exclamation-triangle text-red-500';
        
        const statusText = document.createElement('span');
        statusText.className = 'text-sm font-medium';
        statusText.textContent = isConnected ? 'Firebase 연결됨' : 'Firebase 연결 안됨';
        statusText.style.color = isConnected ? '#10b981' : '#ef4444';
        
        statusDiv.appendChild(statusIcon);
        statusDiv.appendChild(statusText);
        
        // 헤더의 저장/불러오기 버튼 옆에 추가
        const buttonContainer = header.querySelector('.flex.space-x-4');
        buttonContainer.appendChild(statusDiv);
    }

    exportToPDF() {
        try {
            this.showLoading(true);
            
            // jsPDF 라이브러리 확인
            if (typeof window.jsPDF === 'undefined') {
                throw new Error('jsPDF 라이브러리를 불러올 수 없습니다.');
            }

            const { jsPDF } = window.jsPDF;
            const doc = new jsPDF();
            
            // 제목 추가
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text('전사 신기술 세미나 실행계획', 105, 20, { align: 'center' });
            
            // 기본 정보 섹션
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('기본 정보', 20, 40);
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`목표: ${this.currentData.objective || '미입력'}`, 20, 55);
            doc.text(`일시: ${this.currentData.datetime || '미입력'}`, 20, 65);
            doc.text(`장소: ${this.currentData.location || '미입력'}`, 20, 75);
            doc.text(`참석 대상: ${this.currentData.attendees || '미입력'}`, 20, 85);
            
            // 시간 계획 테이블
            if (this.currentData.timeSchedule.length > 0) {
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('시간 계획', 20, 105);
                
                const timeTableData = this.currentData.timeSchedule.map(item => [
                    item.type || '',
                    item.content || '',
                    item.time || '',
                    item.responsible || ''
                ]);
                
                doc.autoTable({
                    startY: 115,
                    head: [['구분', '주요 내용', '시간', '담당']],
                    body: timeTableData,
                    theme: 'grid',
                    headStyles: { fillColor: [59, 130, 246] }
                });
            }
            
            // 참석자 명단 테이블
            if (this.currentData.attendeeList.length > 0) {
                const lastY = doc.lastAutoTable.finalY + 10;
                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.text('세미나 참석 명단', 20, lastY);
                
                const attendeeTableData = this.currentData.attendeeList.map((item, index) => [
                    (index + 1).toString(),
                    item.name || '',
                    item.position || '',
                    item.department || '',
                    item.work || ''
                ]);
                
                doc.autoTable({
                    startY: lastY + 5,
                    head: [['No', '성명', '직급', '소속', '업무']],
                    body: attendeeTableData,
                    theme: 'grid',
                    headStyles: { fillColor: [147, 51, 234] }
                });
            }
            
            // 파일 저장
            const fileName = `세미나_실행계획_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);
            
            this.showSuccessToast('PDF가 성공적으로 내보내졌습니다.');
        } catch (error) {
            console.error('PDF 내보내기 오류:', error);
            this.showErrorToast(`PDF 내보내기 실패: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    exportToExcel() {
        try {
            this.showLoading(true);
            
            // XLSX 라이브러리 확인
            if (typeof XLSX === 'undefined') {
                throw new Error('XLSX 라이브러리를 불러올 수 없습니다.');
            }

            // 워크북 생성
            const wb = XLSX.utils.book_new();
            
            // 기본 정보 시트
            const basicInfoData = [
                ['전사 신기술 세미나 실행계획'],
                [''],
                ['기본 정보'],
                ['목표', this.currentData.objective || '미입력'],
                ['일시', this.currentData.datetime || '미입력'],
                ['장소', this.currentData.location || '미입력'],
                ['참석 대상', this.currentData.attendees || '미입력'],
                [''],
                ['시간 계획'],
                ['구분', '주요 내용', '시간', '담당']
            ];
            
            // 시간 계획 데이터 추가
            this.currentData.timeSchedule.forEach(item => {
                basicInfoData.push([
                    item.type || '',
                    item.content || '',
                    item.time || '',
                    item.responsible || ''
                ]);
            });
            
            basicInfoData.push(['']);
            basicInfoData.push(['세미나 참석 명단']);
            basicInfoData.push(['No', '성명', '직급', '소속', '업무']);
            
            // 참석자 데이터 추가
            this.currentData.attendeeList.forEach((item, index) => {
                basicInfoData.push([
                    (index + 1).toString(),
                    item.name || '',
                    item.position || '',
                    item.department || '',
                    item.work || ''
                ]);
            });
            
            const basicInfoSheet = XLSX.utils.aoa_to_sheet(basicInfoData);
            XLSX.utils.book_append_sheet(wb, basicInfoSheet, '세미나 실행계획');
            
            // 파일 저장
            const fileName = `세미나_실행계획_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);
            
            this.showSuccessToast('Excel 파일이 성공적으로 내보내졌습니다.');
        } catch (error) {
            console.error('Excel 내보내기 오류:', error);
            this.showErrorToast(`Excel 내보내기 실패: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    exportToWord() {
        try {
            this.showLoading(true);
            
            // docx 라이브러리 확인
            if (typeof window.docx === 'undefined') {
                throw new Error('docx 라이브러리를 불러올 수 없습니다.');
            }

            const { Document, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType } = window.docx;
            
            // 문서 생성
            const doc = new Document({
                sections: [{
                    properties: {},
                    children: [
                        // 제목
                        new Paragraph({
                            text: '전사 신기술 세미나 실행계획',
                            heading: 'Heading1',
                            alignment: AlignmentType.CENTER
                        }),
                        
                        // 기본 정보 섹션
                        new Paragraph({
                            text: '기본 정보',
                            heading: 'Heading2'
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({ text: '목표: ', bold: true }),
                                new TextRun({ text: this.currentData.objective || '미입력' })
                            ]
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({ text: '일시: ', bold: true }),
                                new TextRun({ text: this.currentData.datetime || '미입력' })
                            ]
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({ text: '장소: ', bold: true }),
                                new TextRun({ text: this.currentData.location || '미입력' })
                            ]
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({ text: '참석 대상: ', bold: true }),
                                new TextRun({ text: this.currentData.attendees || '미입력' })
                            ]
                        }),
                        
                        // 시간 계획 섹션
                        new Paragraph({
                            text: '시간 계획',
                            heading: 'Heading2'
                        })
                    ]
                }]
            });
            
            // 시간 계획 테이블 추가
            if (this.currentData.timeSchedule.length > 0) {
                const timeTableRows = [
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ text: '구분' })] }),
                            new TableCell({ children: [new Paragraph({ text: '주요 내용' })] }),
                            new TableCell({ children: [new Paragraph({ text: '시간' })] }),
                            new TableCell({ children: [new Paragraph({ text: '담당' })] })
                        ]
                    })
                ];
                
                this.currentData.timeSchedule.forEach(item => {
                    timeTableRows.push(new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ text: item.type || '' })] }),
                            new TableCell({ children: [new Paragraph({ text: item.content || '' })] }),
                            new TableCell({ children: [new Paragraph({ text: item.time || '' })] }),
                            new TableCell({ children: [new Paragraph({ text: item.responsible || '' })] })
                        ]
                    }));
                });
                
                const timeTable = new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: timeTableRows
                });
                
                doc.addSection({
                    children: [timeTable]
                });
            }
            
            // 참석자 명단 섹션 추가
            if (this.currentData.attendeeList.length > 0) {
                const attendeeTableRows = [
                    new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ text: 'No' })] }),
                            new TableCell({ children: [new Paragraph({ text: '성명' })] }),
                            new TableCell({ children: [new Paragraph({ text: '직급' })] }),
                            new TableCell({ children: [new Paragraph({ text: '소속' })] }),
                            new TableCell({ children: [new Paragraph({ text: '업무' })] })
                        ]
                    })
                ];
                
                this.currentData.attendeeList.forEach((item, index) => {
                    attendeeTableRows.push(new TableRow({
                        children: [
                            new TableCell({ children: [new Paragraph({ text: (index + 1).toString() })] }),
                            new TableCell({ children: [new Paragraph({ text: item.name || '' })] }),
                            new TableCell({ children: [new Paragraph({ text: item.position || '' })] }),
                            new TableCell({ children: [new Paragraph({ text: item.department || '' })] }),
                            new TableCell({ children: [new Paragraph({ text: item.work || '' })] })
                        ]
                    }));
                });
                
                const attendeeTable = new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: attendeeTableRows
                });
                
                doc.addSection({
                    children: [
                        new Paragraph({
                            text: '세미나 참석 명단',
                            heading: 'Heading2'
                        }),
                        attendeeTable
                    ]
                });
            }
            
            // 파일 생성 및 저장
            const fileName = `세미나_실행계획_${new Date().toISOString().split('T')[0]}.docx`;
            
            window.docx.Packer.toBlob(doc).then(blob => {
                if (typeof saveAs !== 'undefined') {
                    saveAs(blob, fileName);
                    this.showSuccessToast('Word 문서가 성공적으로 내보내졌습니다.');
                } else {
                    // FileSaver.js가 없는 경우 직접 다운로드
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    this.showSuccessToast('Word 문서가 성공적으로 내보내졌습니다.');
                }
            }).catch(error => {
                throw new Error(`Word 문서 생성 실패: ${error.message}`);
            });
            
        } catch (error) {
            console.error('Word 내보내기 오류:', error);
            this.showErrorToast(`Word 내보내기 실패: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }
}

// 앱 초기화
let app;
document.addEventListener('DOMContentLoaded', async function() {
    app = new SeminarPlanningApp();
    await app.init();
});

// 전역 함수로 노출 (HTML에서 호출하기 위해)
window.app = app;
