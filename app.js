// 전사 신기술 세미나 실행계획 웹앱 메인 JavaScript

class SeminarPlanningApp {
    constructor() {
        this.currentData = {
            session: '',
            objective: '',
            datetime: '',
            location: '',
            attendees: '',
            timeSchedule: [],
            attendeeList: []
        };
        
        this.currentDocumentId = null; // Firebase 문서 ID 저장
        
        // 라이브러리 로딩 상태 확인 및 초기화
        this.initializeApp();
    }
    
    async initializeApp() {
        await this.checkLibraries();
        await this.init();
    }

    

    // 간단한 라이브러리 상태 확인
    async checkLibraries() {
        console.log('🔍 내보내기 라이브러리 상태 확인 중...');
        
        // exportLibraries 객체가 준비될 때까지 대기
        let attempts = 0;
        const maxAttempts = 30; // 최대 3초 대기
        
        while (attempts < maxAttempts) {
            if (window.exportLibraries) {
                console.log('✅ 내보내기 라이브러리 상태 확인 완료');
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }
        
        if (attempts === maxAttempts) {
            console.warn('⚠️ 내보내기 라이브러리 상태 확인 시간 초과');
        }
        
        // 라이브러리 상태 출력
        if (window.exportLibraries) {
            console.log('📊 내보내기 라이브러리 상태:', window.exportLibraries);
        }
    }
    
    // 라이브러리 존재 여부 확인 (간단한 방식)
    getLibrary(name) {
        if (window.exportLibraries && window.exportLibraries[name]) {
            return true;
        }
        
        // 특별한 경우들 처리
        if (name === 'jsPDF' && (window.jsPDF || window.jspdf?.jsPDF)) {
            return true;
        }
        if (name === 'saveAs' && window.saveAs) {
            return true;
        }
        
        return false;
    }

    // 라이브러리 인스턴스 반환 (간단한 방식)
    getLibraryInstance(name) {
        // exportLibraries 상태 확인
        if (window.exportLibraries && !window.exportLibraries[name]) {
            console.warn(`⚠️ ${name} 라이브러리가 로드되지 않았습니다.`);
            return null;
        }
        
        // 특별한 경우들 처리
        if (name === 'jsPDF') {
            if (window.jsPDF) {
                console.log(`🎯 ${name} 라이브러리 (window.jsPDF) 접근 성공`);
                return window.jsPDF;
            }
            if (window.jspdf?.jsPDF) {
                console.log(`🎯 ${name} 라이브러리 (window.jspdf.jsPDF) 접근 성공`);
                return window.jspdf.jsPDF;
            }
        }
        
        if (name === 'saveAs' && window.saveAs) {
            console.log(`🎯 ${name} 라이브러리 (window.saveAs) 접근 성공`);
            return window.saveAs;
        }
        
        console.error(`❌ ${name} 라이브러리를 찾을 수 없습니다.`);
        return null;
    }

    async init() {
        this.bindEvents();
        await this.loadInitialData();
        this.addDefaultRows();
    }

    bindEvents() {
        // 초기화 버튼
        document.getElementById('resetBtn').addEventListener('click', () => this.resetForm());
        
        // 저장 버튼
        document.getElementById('saveBtn').addEventListener('click', () => this.saveData());
        
        // 삭제 버튼
        document.getElementById('deleteBtn').addEventListener('click', () => this.deleteData());
        
        // 일괄삭제 버튼
        //document.getElementById('bulkDeleteBtn').addEventListener('click', () => this.bulkDeleteData());
        
        // 조회 버튼
        document.getElementById('loadBtn').addEventListener('click', () => this.showSearchModal());
        
        // 시간 계획 행 추가
        document.getElementById('addTimeRow').addEventListener('click', () => this.addTimeRow());
        
        // 참석자 행 추가
        document.getElementById('addAttendeeRow').addEventListener('click', () => this.addAttendeeRow());
        
        // 내보내기 버튼들
        document.getElementById('exportPDF').addEventListener('click', () => this.exportToPDF());
             
        // 입력 필드 변경 감지
        this.bindInputEvents();
    }

    bindInputEvents() {
        // 기본 정보 입력 필드들
        const basicFields = ['objective', 'location', 'attendees'];
        basicFields.forEach(field => {
            const element = document.getElementById(field);
            if (element) {
                element.addEventListener('input', (e) => {
                    this.currentData[field] = e.target.value;
                });
            }
        });
        
        // 일시 필드에 대한 특별한 처리
        const datetimeElement = document.getElementById('datetime');
        if (datetimeElement) {
            datetimeElement.addEventListener('input', (e) => {
                this.currentData.datetime = e.target.value;
                this.validateDateTimeFormat(e.target);
            });
            
            datetimeElement.addEventListener('blur', (e) => {
                this.validateDateTimeFormat(e.target);
            });
        }
    }
    
    // 일시 형식 검증
    validateDateTimeFormat(element) {
        const value = element.value.trim();
        if (!value) {
            element.classList.remove('border-red-500', 'border-green-500');
            element.classList.add('border-gray-300');
            return;
        }
        
        // 다양한 날짜 형식 지원
        const datePatterns = [
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/,  // 2025-08-10T14:00
            /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/,  // 2025-08-10 14:00
            /^\d{4}-\d{2}-\d{2}$/,              // 2025-08-10
            /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/, // 2025/08/10 14:00
            /^\d{4}\/\d{2}\/\d{2}$/             // 2025/08/10
        ];
        
        const isValidFormat = datePatterns.some(pattern => pattern.test(value));
        const isValidDate = !isNaN(new Date(value).getTime());
        
        if (isValidFormat && isValidDate) {
            element.classList.remove('border-red-500');
            element.classList.add('border-green-500');
        } else {
            element.classList.remove('border-green-500');
            element.classList.add('border-red-500');
        }
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
            if (key === 'session') {
                // 회차 필드 특별 처리
                this.populateSessionField();
            } else {
                const element = document.getElementById(key);
                if (element && typeof this.currentData[key] === 'string') {
                    element.value = this.currentData[key];
                }
            }
        });

        // 시간 계획 테이블 채우기
        this.populateTimeTable();
        
        // 참석자 테이블 채우기
        this.populateAttendeeTable();
    }

    addDefaultRows() {
        // 기본 시간 계획 행 추가 (직접 생성, addTimeRow() 호출하지 않음)
        if (this.currentData.timeSchedule.length === 0) {
            const tbody = document.getElementById('timeTableBody');
            const row = document.createElement('tr');
            row.className = 'table-row-hover';
            row.innerHTML = `
                <td class="px-4 py-3 border-b">
                    <select class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" data-index="0" data-field="type">
                        <option value="">선택</option>
                        <option value="발표">발표</option>
                        <option value="토의">토의</option>
                        <option value="정리">정리</option>
                        <option value="석식">석식</option>
                        <option value="보고">보고</option>
                    </select>
                </td>
                <td class="px-4 py-3 border-b">
                    <textarea class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" 
                              placeholder="주요 내용을 입력하세요 (엔터로 줄바꿈)" 
                              rows="2"
                              data-index="0" data-field="content"></textarea>
                </td>
                <td class="px-4 py-3 border-b">
                    <input type="text" class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                           placeholder="시간을 입력하세요 (예: 16:00)" 
                           data-index="0" data-field="time">
                </td>
                <td class="px-4 py-3 border-b">
                    <input type="text" class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                           placeholder="담당자를 입력하세요" 
                           data-index="0" data-field="responsible">
                </td>
                <td class="px-4 py-3 border-b">
                    <button onclick="app.removeTimeRow(0)" class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm transition-colors duration-200">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
            
            // 이벤트 리스너 추가 (모바일 환경 고려)
            this.bindTimeRowEvents(row, 0);
            
            // 데이터 구조에 기본 행 추가
            this.currentData.timeSchedule[0] = {
                type: '',
                content: '',
                time: '',
                responsible: ''
            };
        }
        
        // 기본 참석자 행 추가 (직접 생성, addAttendeeRow() 호출하지 않음)
        if (this.currentData.attendeeList.length === 0) {
            const tbody = document.getElementById('attendeeTableBody');
            const row = document.createElement('tr');
            row.className = 'table-row-hover';
            row.innerHTML = `
                <td class="px-4 py-3 border-b text-center">1</td>
                <td class="px-4 py-3 border-b">
                    <input type="text" class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                           placeholder="성명을 입력하세요" 
                           data-index="0" data-field="name">
                </td>
                <td class="px-4 py-3 border-b">
                    <input type="text" class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                           placeholder="직급을 입력하세요" 
                           data-index="0" data-field="position">
                </td>
                <td class="px-4 py-3 border-b">
                    <select class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                            data-index="0" data-field="department">
                        <option value="">선택하세요</option>
                        <option value="SI사업본부">SI사업본부</option>
                        <option value="AI사업본부">AI사업본부</option>
                        <option value="전략사업본부">전략사업본부</option>
                        <option value="경영관리본부">경영관리본부</option>
                        <option value="직접입력">직접입력</option>
                    </select>
                    <input type="text" class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-1 hidden" 
                           placeholder="소속을 직접 입력하세요" 
                           data-index="0" data-field="department"
                           id="departmentInput_0">
                </td>
                <td class="px-4 py-3 border-b">
                    <input type="text" class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                           placeholder="업무를 입력하세요" 
                           data-index="0" data-field="work">
                </td>
                <td class="px-4 py-3 border-b">
                    <button onclick="app.removeAttendeeRow(0)" class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm transition-colors duration-200">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
            
            // 이벤트 리스너 추가 (모바일 환경 고려)
            this.bindAttendeeRowEvents(row, 0);
            
            // 데이터 구조에 기본 행 추가
            this.currentData.attendeeList[0] = {
                name: '',
                position: '',
                department: '',
                work: ''
            };
        }
    }

    addTimeRow() {
        const tbody = document.getElementById('timeTableBody');
        const rowCount = tbody.children.length;
        
        const row = document.createElement('tr');
        row.className = 'table-row-hover';
        row.innerHTML = `
            <td class="px-4 py-3 border-b">
                <select class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" data-index="${rowCount}" data-field="type">
                    <option value="">선택</option>
                    <option value="발표">발표</option>
                    <option value="토의">토의</option>
                    <option value="정리">정리</option>
                    <option value="석식">석식</option>
                    <option value="보고">보고</option>
                </select>
            </td>
            <td class="px-4 py-3 border-b">
                <textarea class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" 
                          placeholder="주요 내용을 입력하세요 (엔터로 줄바꿈)" 
                          rows="2"
                          data-index="${rowCount}" data-field="content"></textarea>
            </td>
            <td class="px-4 py-3 border-b">
                <input type="text" class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                       placeholder="시간을 입력하세요 (예: 16:00)" 
                       data-index="${rowCount}" data-field="time">
            </td>
            <td class="px-4 py-3 border-b">
                <input type="text" class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                       placeholder="담당자를 입력하세요" 
                       data-index="${rowCount}" data-field="responsible">
            </td>
            <td class="px-4 py-3 border-b">
                <button onclick="app.removeTimeRow(${rowCount})" class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm transition-colors duration-200">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
        
        // 이벤트 리스너 추가 (모바일 환경 고려)
        this.bindTimeRowEvents(row, rowCount);
        
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
                       data-index="${rowCount}" data-field="name">
            </td>
            <td class="px-4 py-3 border-b">
                <input type="text" class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                       placeholder="직급을 입력하세요" 
                       data-index="${rowCount}" data-field="position">
            </td>
            <td class="px-4 py-3 border-b">
                <select class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                        data-index="${rowCount}" data-field="department">
                    <option value="">선택하세요</option>
                    <option value="SI사업본부">SI사업본부</option>
                    <option value="AI사업본부">AI사업본부</option>
                    <option value="전략사업본부">전략사업본부</option>
                    <option value="경영관리본부">경영관리본부</option>
                    <option value="직접입력">직접입력</option>
                </select>
                <input type="text" class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-1 hidden" 
                       placeholder="소속을 직접 입력하세요" 
                       data-index="${rowCount}" data-field="department"
                       id="departmentInput_${rowCount}">
            </td>
            <td class="px-4 py-3 border-b">
                <input type="text" class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                       placeholder="업무를 입력하세요" 
                       data-index="${rowCount}" data-field="work">
            </td>
            <td class="px-4 py-3 border-b">
                <button onclick="app.removeAttendeeRow(${rowCount})" class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm transition-colors duration-200">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        
        tbody.appendChild(row);
        
        // 이벤트 리스너 추가 (모바일 환경 고려)
        this.bindAttendeeRowEvents(row, rowCount);
        
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
            
            // 소속 필드에서 "직접입력" 선택 시 입력 필드 표시/숨김 처리
            if (field === 'department') {
                // 현재 활성화된 요소 찾기
                const activeElement = document.activeElement;
                const selectElement = activeElement.tagName === 'SELECT' ? activeElement : 
                                    activeElement.closest('tr').querySelector('select[data-field="department"]');
                const inputElement = document.getElementById(`departmentInput_${index}`);
                
                if (value === '직접입력') {
                    if (selectElement) selectElement.style.display = 'none';
                    if (inputElement) {
                        inputElement.classList.remove('hidden');
                        inputElement.focus();
                    }
                } else {
                    if (selectElement) selectElement.style.display = 'block';
                    if (inputElement) inputElement.classList.add('hidden');
                }
            }
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
        if (placeholder.includes('시간')) return 'time';
        if (placeholder.includes('담당자')) return 'responsible';
        return '';
    }

    populateTimeTable() {
        const tbody = document.getElementById('timeTableBody');
        tbody.innerHTML = '';
        
        this.currentData.timeSchedule.forEach((item, index) => {
            // 직접 행 생성 (addTimeRow() 호출하지 않음)
            const row = document.createElement('tr');
            row.className = 'table-row-hover';
            row.innerHTML = `
                <td class="px-4 py-3 border-b">
                    <select class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" data-index="${index}" data-field="type">
                        <option value="">선택</option>
                        <option value="발표">발표</option>
                        <option value="토의">토의</option>
                        <option value="정리">정리</option>
                        <option value="석식">석식</option>
                        <option value="보고">보고</option>
                    </select>
                </td>
                <td class="px-4 py-3 border-b">
                    <textarea class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none" 
                              placeholder="주요 내용을 입력하세요 (엔터로 줄바꿈)" 
                              rows="2"
                              data-index="${index}" data-field="content"></textarea>
                </td>
                <td class="px-4 py-3 border-b">
                    <input type="text" class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                           placeholder="시간을 입력하세요 (예: 16:00)" 
                           data-index="${index}" data-field="time">
                </td>
                <td class="px-4 py-3 border-b">
                    <input type="text" class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                           placeholder="담당자를 입력하세요" 
                           data-index="${index}" data-field="responsible">
                </td>
                <td class="px-4 py-3 border-b">
                    <button onclick="app.removeTimeRow(${index})" class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm transition-colors duration-200">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
            
            // 데이터 채우기 (모바일 환경 고려)
            const inputs = row.querySelectorAll('input, select, textarea');
            if (inputs[0]) {
                inputs[0].value = item.type || '';
                // 모바일에서 select 값이 제대로 설정되도록 강제 업데이트
                setTimeout(() => {
                    inputs[0].value = item.type || '';
                }, 10);
            }
            if (inputs[1]) {
                inputs[1].value = item.content || '';
                // textarea의 경우 value 속성 설정
                if (inputs[1].tagName === 'TEXTAREA') {
                    inputs[1].textContent = item.content || '';
                } else {
                    inputs[1].setAttribute('value', item.content || '');
                }
            }
            if (inputs[2]) {
                inputs[2].value = item.time || '';
                inputs[2].setAttribute('value', item.time || '');
            }
            if (inputs[3]) {
                inputs[3].value = item.responsible || '';
                inputs[3].setAttribute('value', item.responsible || '');
            }
            
            // 이벤트 리스너 추가 (모바일 환경 고려)
            this.bindTimeRowEvents(row, index);
        });
    }
    
    // 시간 계획 행 이벤트 바인딩 (모바일 환경 고려)
    bindTimeRowEvents(row, index) {
        const inputs = row.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            // 모바일에서 input 이벤트가 제대로 작동하도록 여러 이벤트 리스너 추가
            input.addEventListener('input', (e) => {
                this.updateTimeSchedule(index, input.dataset.field, e.target.value);
            });
            input.addEventListener('change', (e) => {
                this.updateTimeSchedule(index, input.dataset.field, e.target.value);
            });
            input.addEventListener('blur', (e) => {
                this.updateTimeSchedule(index, input.dataset.field, e.target.value);
            });
        });
    }
    
    // 참석자 행 이벤트 바인딩 (모바일 환경 고려)
    bindAttendeeRowEvents(row, index) {
        const inputs = row.querySelectorAll('input, select');
        inputs.forEach(input => {
            // 모바일에서 input 이벤트가 제대로 작동하도록 여러 이벤트 리스너 추가
            input.addEventListener('input', (e) => {
                this.updateAttendeeList(index, input.dataset.field, e.target.value);
            });
            input.addEventListener('change', (e) => {
                this.updateAttendeeList(index, input.dataset.field, e.target.value);
            });
            input.addEventListener('blur', (e) => {
                this.updateAttendeeList(index, input.dataset.field, e.target.value);
            });
        });
    }

    populateAttendeeTable() {
        const tbody = document.getElementById('attendeeTableBody');
        tbody.innerHTML = '';
        
        this.currentData.attendeeList.forEach((item, index) => {
            // 직접 행 생성 (addAttendeeRow() 호출하지 않음)
            const row = document.createElement('tr');
            row.className = 'table-row-hover';
            row.innerHTML = `
                <td class="px-4 py-3 border-b text-center">${index + 1}</td>
                <td class="px-4 py-3 border-b">
                    <input type="text" class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                           placeholder="성명을 입력하세요" 
                           onchange="app.updateAttendeeList(${index}, 'name', this.value)">
                </td>
                <td class="px-4 py-3 border-b">
                    <input type="text" class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                           placeholder="직급을 입력하세요" 
                           onchange="app.updateAttendeeList(${index}, 'position', this.value)">
                </td>
                <td class="px-4 py-3 border-b">
                    <select class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                            onchange="app.updateAttendeeList(${index}, 'department', this.value)">
                        <option value="">선택하세요</option>
                        <option value="SI사업본부">SI사업본부</option>
                        <option value="AI사업본부">AI사업본부</option>
                        <option value="전략사업본부">전략사업본부</option>
                        <option value="경영관리본부">경영관리본부</option>
                        <option value="직접입력">직접입력</option>
                    </select>
                    <input type="text" class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent mt-1 hidden" 
                           placeholder="소속을 직접 입력하세요" 
                           onchange="app.updateAttendeeList(${index}, 'department', this.value)"
                           id="departmentInput_${index}">
                </td>
                <td class="px-4 py-3 border-b">
                    <input type="text" class="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                           placeholder="업무를 입력하세요" 
                           onchange="app.updateAttendeeList(${index}, 'work', this.value)">
                </td>
                <td class="px-4 py-3 border-b">
                    <button onclick="app.removeAttendeeRow(${index})" class="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-sm transition-colors duration-200">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            `;
            
            tbody.appendChild(row);
            
            // 데이터 채우기 (모바일 환경 고려)
            const inputs = row.querySelectorAll('input');
            const select = row.querySelector('select');
            
            if (inputs[0]) {
                inputs[0].value = item.name || '';
                inputs[0].setAttribute('value', item.name || '');
            }
            if (inputs[1]) {
                inputs[1].value = item.position || '';
                inputs[1].setAttribute('value', item.position || '');
            }
            
            // 소속 필드 처리
            if (item.department) {
                const departmentOptions = ['SI사업본부', 'AI사업본부', '전략사업본부', '경영관리본부'];
                if (departmentOptions.includes(item.department)) {
                    // 미리 정의된 옵션인 경우
                    if (select) {
                        select.value = item.department;
                        setTimeout(() => {
                            select.value = item.department;
                        }, 10);
                    }
                } else {
                    // 직접 입력된 값인 경우
                    if (select) {
                        select.value = '직접입력';
                        select.style.display = 'none';
                        setTimeout(() => {
                            select.value = '직접입력';
                        }, 10);
                    }
                    if (inputs[2]) {
                        inputs[2].value = item.department;
                        inputs[2].setAttribute('value', item.department);
                        inputs[2].classList.remove('hidden');
                    }
                }
            }
            
            if (inputs[3]) {
                inputs[3].value = item.work || '';
                inputs[3].setAttribute('value', item.work || '');
            }
            
            // 이벤트 리스너 추가 (모바일 환경 고려)
            this.bindAttendeeRowEvents(row, index);
        });
    }

    async saveData() {
        try {
            this.showLoading(true);
            
            // 현재 폼 데이터 수집
            this.collectFormData();
            
            // 회차와 일시가 모두 입력되었는지 확인
            if (!this.currentData.session || !this.currentData.datetime) {
                this.showErrorToast('회차와 일시를 모두 입력해주세요.');
                return;
            }
            
            // 회차 + 일시를 키값으로 사용
            const keyValue = `${this.currentData.session}_${this.currentData.datetime}`;
            
            // 기존 데이터에서 동일한 키값을 가진 데이터 찾기
            const existingData = await this.findExistingDataByKey(keyValue);
            
            let result;
            
            if (existingData) {
                // 기존 데이터가 있으면 수정
                console.log('기존 데이터 발견, 수정 처리:', existingData.id);
                
                if (useLocalStorage) {
                    result = this.saveToLocalStorage(this.currentData, existingData.id);
                } else {
                    result = await updateData(existingData.id, this.currentData);
                }
                
                if (result.success) {
                    this.currentDocumentId = existingData.id;
                    this.showSuccessToast(`${this.currentData.session} 세미나 데이터가 수정되었습니다.`);
                }
            } else {
                // 기존 데이터가 없으면 새로 등록
                console.log('새 데이터 등록 처리');
                
                if (useLocalStorage) {
                    result = this.saveToLocalStorage(this.currentData);
                } else {
                    result = await saveData(this.currentData);
                }
                
                if (result.success && result.id) {
                    this.currentDocumentId = result.id;
                    this.showSuccessToast(`${this.currentData.session} 세미나 데이터가 새로 등록되었습니다.`);
                }
            }
            
            if (!result.success) {
                this.showErrorToast(result.message);
            }
            
        } catch (error) {
            console.error('저장 오류:', error);
            this.showErrorToast('저장 중 오류가 발생했습니다.');
        } finally {
            this.showLoading(false);
        }
    }
    
    // 회차 + 일시 키값으로 기존 데이터 찾기
    async findExistingDataByKey(keyValue) {
        try {
            if (useLocalStorage) {
                // 로컬 스토리지에서 모든 세미나 데이터 찾기
                const allData = this.getAllLocalStorageData();
                
                for (const item of allData) {
                    if (item.data.session && item.data.datetime) {
                        const existingKey = `${item.data.session}_${item.data.datetime}`;
                        if (existingKey === keyValue) {
                            return { id: item.id, data: item.data };
                        }
                    }
                }
                return null;
            } else {
                // Firebase에서 데이터 찾기
                const snapshot = await db.collection('seminarPlans').get();
                
                for (const doc of snapshot.docs) {
                    const data = doc.data();
                    if (data.session && data.datetime) {
                        const existingKey = `${data.session}_${data.datetime}`;
                        if (existingKey === keyValue) {
                            return { id: doc.id, data: data };
                        }
                    }
                }
                return null;
            }
        } catch (error) {
            console.error('기존 데이터 찾기 오류:', error);
            return null;
        }
    }
    
    // 로컬 스토리지에서 모든 세미나 데이터 가져오기
    getAllLocalStorageData() {
        try {
            const data = localStorage.getItem('seminarPlans');
            if (data) {
                return JSON.parse(data);
            }
            return [];
        } catch (error) {
            console.error('로컬 스토리지 데이터 읽기 오류:', error);
            return [];
        }
    }
    
    // 로컬 스토리지에 세미나 데이터 저장/업데이트
    saveToLocalStorage(seminarData, id = null) {
        try {
            let allData = this.getAllLocalStorageData();
            
            if (id) {
                // 기존 데이터 업데이트
                const index = allData.findIndex(item => item.id === id);
                if (index !== -1) {
                    allData[index].data = seminarData;
                    allData[index].updatedAt = new Date().toISOString();
                } else {
                    // ID가 있지만 데이터를 찾을 수 없는 경우 새로 추가
                    allData.push({
                        id: id,
                        data: seminarData,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    });
                }
            } else {
                // 새 데이터 추가
                const newId = 'local_' + Date.now();
                allData.push({
                    id: newId,
                    data: seminarData,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
            }
            
            localStorage.setItem('seminarPlans', JSON.stringify(allData));
            return { success: true, id: id || 'local_' + Date.now() };
        } catch (error) {
            console.error('로컬 스토리지 저장 오류:', error);
            return { success: false, message: error.message };
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
        this.currentData.session = this.currentData.session || '';
        this.currentData.objective = document.getElementById('objective').value;
        this.currentData.datetime = document.getElementById('datetime').value;
        this.currentData.location = document.getElementById('location').value;
        this.currentData.attendees = document.getElementById('attendees').value;
        
        // 시간 계획 데이터 수집
        const timeRows = document.getElementById('timeTableBody').children;
        this.currentData.timeSchedule = [];
        
        Array.from(timeRows).forEach(row => {
            const inputs = row.querySelectorAll('input, select, textarea');
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
            const select = row.querySelector('select');
            
            // 소속 데이터 수집 (select 또는 input에서)
            let department = '';
            if (select && select.value && select.value !== '직접입력') {
                department = select.value;
            } else if (inputs[2] && inputs[2].value) {
                department = inputs[2].value;
            }
            
            this.currentData.attendeeList.push({
                name: inputs[0]?.value || '',
                position: inputs[1]?.value || '',
                department: department,
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

    // 조회 모달 표시
    showSearchModal() {
        const modal = document.getElementById('searchModal');
        modal.classList.remove('hidden');
        
        // 메인 화면 스크롤 방지
        document.body.style.overflow = 'hidden';
        
        // 모달 이벤트 바인딩
        this.bindSearchModalEvents();
        
        // 전체 데이터 조회
        this.searchSeminars();
    }
    
    // 조회 모달 닫기
    closeSearchModal() {
        const modal = document.getElementById('searchModal');
        modal.classList.add('hidden');
        
        // 메인 화면 스크롤 복원
        document.body.style.overflow = '';
    }

    // 조회 모달 이벤트 바인딩
    bindSearchModalEvents() {
        // 모달 닫기
        document.getElementById('closeSearchModal').addEventListener('click', () => {
            this.closeSearchModal();
        });

        // 등록 버튼
        document.getElementById('addNewBtn').addEventListener('click', () => {
            this.addNewSeminar();
        });
    }



    // 세미나 조회 (전체 데이터)
    async searchSeminars() {
        try {
            this.showLoading(true);
            
            const result = await loadAllPlans();
            
            if (result.success) {
                // 데이터 유효성 검사 및 정규화
                const normalizedData = result.data.map(item => ({
                    ...item,
                    session: this.ensureStringValue(item.session),
                    objective: this.ensureStringValue(item.objective),
                    datetime: this.ensureStringValue(item.datetime),
                    location: this.ensureStringValue(item.location),
                    attendees: this.ensureStringValue(item.attendees)
                }));
                
                // 일시를 키값으로 내림차순 정렬
                const sortedData = normalizedData.sort((a, b) => {
                    const dateA = new Date(a.datetime || '1970-01-01');
                    const dateB = new Date(b.datetime || '1970-01-01');
                    return dateB - dateA; // 내림차순 (최신 날짜가 먼저)
                });
                
                console.log('📊 조회된 데이터:', sortedData);
                this.displaySearchResults(sortedData);
            } else {
                this.showErrorToast(result.message);
            }
        } catch (error) {
            console.error('조회 오류:', error);
            this.showErrorToast('조회 중 오류가 발생했습니다.');
        } finally {
            this.showLoading(false);
        }
    }

        // 검색 결과 표시
    displaySearchResults(data) {
        const tbody = document.getElementById('searchResultBody');
        tbody.innerHTML = '';
        
        if (data.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-8 py-16 text-center">
                        <div class="flex flex-col items-center space-y-4">
                            <div class="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                                <i class="fas fa-search text-3xl text-blue-400"></i>
                            </div>
                            <div class="text-center">
                                <h3 class="text-xl font-semibold text-gray-700 mb-2">조회된 결과가 없습니다</h3>
                                <p class="text-gray-500">새로운 세미나를 등록해보세요</p>
                            </div>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }
        
        data.forEach((item, index) => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer transition-all duration-200 group';
            row.onclick = () => this.loadSeminarDetailByKey(item.session, item.datetime);
            
            // 모바일 호환성을 위한 데이터 처리
            const session = this.ensureStringValue(item.session) || '미입력';
            const datetime = this.ensureStringValue(item.datetime) || '미입력';
            const objective = this.ensureStringValue(item.objective) || '미입력';
            const location = this.ensureStringValue(item.location) || '미입력';
            const attendees = this.ensureStringValue(item.attendees) || '미입력';
            
            // 회차 배지 스타일
            const sessionBadge = session !== '미입력' ? 
                `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200">
                    <i class="fas fa-hashtag mr-1"></i>${this.escapeHtml(session)}
                </span>` : 
                `<span class="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    <i class="fas fa-minus mr-1"></i>미입력
                </span>`;
            
            row.innerHTML = `
                <td class="px-6 py-4">
                    ${sessionBadge}
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center space-x-2 group-hover:text-blue-600 transition-colors duration-200">
                        <i class="fas fa-calendar-alt text-blue-400 group-hover:text-blue-600"></i>
                        <span class="font-medium">${this.escapeHtml(datetime)}</span>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="max-w-xs">
                        <p class="text-gray-800 truncate group-hover:text-gray-900 transition-colors duration-200" title="${this.escapeHtml(objective)}">
                            ${this.escapeHtml(objective)}
                        </p>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center space-x-2">
                        <i class="fas fa-map-marker-alt text-red-400"></i>
                        <span class="text-gray-700">${this.escapeHtml(location)}</span>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="flex items-center space-x-2">
                        <i class="fas fa-users text-green-400"></i>
                        <span class="text-gray-700">${this.escapeHtml(attendees)}</span>
                    </div>
                </td>
            `;
            
            tbody.appendChild(row);
        });
    }

    // 회차_일시 키값으로 세미나 상세 정보 로드
    async loadSeminarDetailByKey(session, datetime) {
        try {
            this.showLoading(true);
            console.log('🔍 세미나 상세 정보 로드 시작, 회차:', session, '일시:', datetime);
            
            // 회차_일시 키값 생성
            const keyValue = `${session}_${datetime}`;
            
            // 키값으로 기존 데이터 찾기
            const existingData = await this.findExistingDataByKey(keyValue);
            console.log('📊 조회 결과:', existingData);
            
            if (existingData) {
                // 모달 닫기
                this.closeSearchModal();
                
                // 데이터 유효성 검사 및 정규화
                const normalizedData = {
                    ...existingData.data,
                    session: this.ensureStringValue(existingData.data.session),
                    objective: this.ensureStringValue(existingData.data.objective),
                    datetime: this.ensureStringValue(existingData.data.datetime),
                    location: this.ensureStringValue(existingData.data.location),
                    attendees: this.ensureStringValue(existingData.data.attendees),
                    timeSchedule: Array.isArray(existingData.data.timeSchedule) ? existingData.data.timeSchedule.map(item => ({
                        type: this.ensureStringValue(item.type),
                        content: this.ensureStringValue(item.content),
                        time: this.ensureStringValue(item.time),
                        responsible: this.ensureStringValue(item.responsible)
                    })) : [],
                    attendeeList: Array.isArray(existingData.data.attendeeList) ? existingData.data.attendeeList.map(item => ({
                        name: this.ensureStringValue(item.name),
                        position: this.ensureStringValue(item.position),
                        department: this.ensureStringValue(item.department),
                        work: this.ensureStringValue(item.work)
                    })) : []
                };
                
                console.log('📋 정규화된 세미나 데이터:', normalizedData);
                console.log('📋 시간 계획 데이터:', normalizedData.timeSchedule);
                console.log('📋 참석자 데이터:', normalizedData.attendeeList);
                
                // 메인 화면에 데이터 로드
                this.currentData = normalizedData;
                this.currentDocumentId = existingData.id; // 찾은 데이터의 ID 사용
                console.log('📋 currentData 설정 완료:', this.currentData);
                
                this.populateForm();
                console.log('📋 폼 채우기 완료');
                
                this.showSuccessToast(`${session} 세미나 계획을 불러왔습니다.`);
            } else {
                console.error('❌ 세미나 조회 실패: 해당 회차와 일시의 데이터를 찾을 수 없습니다.');
                this.showErrorToast('해당 회차와 일시의 세미나 계획을 찾을 수 없습니다.');
            }
        } catch (error) {
            console.error('❌ 상세 정보 로드 오류:', error);
            this.showErrorToast('상세 정보 로드 중 오류가 발생했습니다.');
        } finally {
            this.showLoading(false);
        }
    }

    // 세미나 상세 정보 로드 (기존 ID 기반 - 호환성 유지)
    async loadSeminarDetail(id) {
        try {
            this.showLoading(true);
            console.log('🔍 세미나 상세 정보 로드 시작, ID:', id);
            
            // Firebase에서 해당 문서 조회
            const result = await this.getSeminarById(id);
            console.log('📊 조회 결과:', result);
            
            if (result.success) {
                // 모달 닫기
                this.closeSearchModal();
                
                // 데이터 유효성 검사 및 정규화
                const normalizedData = {
                    ...result.data,
                    session: this.ensureStringValue(result.data.session),
                    objective: this.ensureStringValue(result.data.objective),
                    datetime: this.ensureStringValue(result.data.datetime),
                    location: this.ensureStringValue(result.data.location),
                    attendees: this.ensureStringValue(result.data.attendees),
                    timeSchedule: Array.isArray(result.data.timeSchedule) ? result.data.timeSchedule.map(item => ({
                        type: this.ensureStringValue(item.type),
                        content: this.ensureStringValue(item.content),
                        time: this.ensureStringValue(item.time),
                        responsible: this.ensureStringValue(item.responsible)
                    })) : [],
                    attendeeList: Array.isArray(result.data.attendeeList) ? result.data.attendeeList.map(item => ({
                        name: this.ensureStringValue(item.name),
                        position: this.ensureStringValue(item.position),
                        department: this.ensureStringValue(item.department),
                        work: this.ensureStringValue(item.work)
                    })) : []
                };
                
                console.log('📋 정규화된 세미나 데이터:', normalizedData);
                console.log('📋 시간 계획 데이터:', normalizedData.timeSchedule);
                console.log('📋 참석자 데이터:', normalizedData.attendeeList);
                
                // 메인 화면에 데이터 로드
                this.currentData = normalizedData;
                this.currentDocumentId = id; // 매개변수로 받은 id 사용
                console.log('📋 currentData 설정 완료:', this.currentData);
                
                this.populateForm();
                console.log('📋 폼 채우기 완료');
                
                this.showSuccessToast('세미나 계획을 불러왔습니다.');
            } else {
                console.error('❌ 세미나 조회 실패:', result.message);
                this.showErrorToast(result.message);
            }
        } catch (error) {
            console.error('❌ 상세 정보 로드 오류:', error);
            this.showErrorToast('상세 정보 로드 중 오류가 발생했습니다.');
        } finally {
            this.showLoading(false);
        }
    }

    // ID로 세미나 조회
    async getSeminarById(id) {
        try {
            if (useLocalStorage) {
                const allData = this.getAllLocalStorageData();
                const seminar = allData.find(item => item.id === id);
                
                if (seminar) {
                    console.log('📁 로컬 스토리지에서 로드된 데이터:', seminar.data);
                    return { success: true, data: seminar.data, id: seminar.id };
                } else {
                    return { success: false, message: '해당 세미나 계획을 찾을 수 없습니다.' };
                }
            } else {
                // Firebase에서 특정 문서 조회
                const doc = await db.collection('seminarPlans').doc(id).get();
                if (doc.exists) {
                    const docData = doc.data();
                    console.log('🔥 Firebase에서 로드된 데이터:', docData);
                    return { success: true, data: docData, id: doc.id };
                } else {
                    return { success: false, message: '해당 세미나 계획을 찾을 수 없습니다.' };
                }
            }
        } catch (error) {
            console.error('세미나 조회 오류:', error);
            return { success: false, message: '세미나 조회 중 오류가 발생했습니다: ' + error.message };
        }
    }

    // 새 세미나 등록
    addNewSeminar() {
        try {
            // 모달 닫기
            this.closeSearchModal();
            
            // 메인 화면 초기화
            this.initializeMainForm();
            
            this.showSuccessToast('새 세미나 등록을 위한 화면이 준비되었습니다.');
        } catch (error) {
            console.error('새 세미나 등록 화면 전환 오류:', error);
            this.showErrorToast('화면 전환 중 오류가 발생했습니다.');
        }
    }

    // 메인 화면 초기화
    initializeMainForm() {
        // 현재 데이터 초기화
        this.currentData = {
            session: '',
            objective: '',
            datetime: '',
            location: '',
            attendees: '',
            timeSchedule: [],
            attendeeList: []
        };
        
        // Firebase 문서 ID 초기화
        this.currentDocumentId = null;
        
        // 폼 필드 초기화
        document.getElementById('sessionSelect').value = '';
        document.getElementById('sessionInput').value = '';
        document.getElementById('sessionSelect').style.display = 'block';
        document.getElementById('sessionInput').classList.add('hidden');
        document.getElementById('objective').value = '';
        document.getElementById('datetime').value = '';
        document.getElementById('location').value = '';
        document.getElementById('attendees').value = '';
        
        // 테이블 초기화
        document.getElementById('timeTableBody').innerHTML = '';
        document.getElementById('attendeeTableBody').innerHTML = '';
        
        // 기본 행 추가 (직접 생성)
        this.addDefaultRows();
    }

    // 회차 필드 업데이트
    updateSessionField(value) {
        const selectElement = document.getElementById('sessionSelect');
        const inputElement = document.getElementById('sessionInput');
        
        if (value === '직접입력') {
            selectElement.style.display = 'none';
            inputElement.classList.remove('hidden');
            inputElement.focus();
            this.currentData.session = '';
        } else if (value) {
            selectElement.style.display = 'block';
            inputElement.classList.add('hidden');
            this.currentData.session = value;
        } else {
            selectElement.style.display = 'block';
            inputElement.classList.add('hidden');
            this.currentData.session = '';
        }
    }

    // 회차 직접 입력 값 업데이트
    updateSessionValue(value) {
        this.currentData.session = value;
    }

    // 회차 필드 데이터 채우기
    populateSessionField() {
        const selectElement = document.getElementById('sessionSelect');
        const inputElement = document.getElementById('sessionInput');
        
        if (this.currentData.session) {
            const sessionOptions = ['제1회', '제2회', '제3회', '제4회', '제5회', '제6회', '제7회', '제8회', '제9회', '제10회'];
            
            if (sessionOptions.includes(this.currentData.session)) {
                // 미리 정의된 옵션인 경우
                selectElement.value = this.currentData.session;
                selectElement.style.display = 'block';
                inputElement.classList.add('hidden');
            } else {
                // 직접 입력된 값인 경우
                selectElement.value = '직접입력';
                selectElement.style.display = 'none';
                inputElement.value = this.currentData.session;
                inputElement.classList.remove('hidden');
            }
        } else {
            // 빈 값인 경우
            selectElement.value = '';
            selectElement.style.display = 'block';
            inputElement.value = '';
            inputElement.classList.add('hidden');
        }
    }

    // 폼 초기화 (사용자 요청)
    resetForm() {
        try {
            // 입력 필드만 초기화 (기존 데이터는 유지)
            this.clearInputFields();
            
            // 시간 계획과 참석자 명단에 1행씩 자동 추가
            this.addTimeRow();
            this.addAttendeeRow();
            
            this.showSuccessToast('모든 입력 필드가 초기화되고 기본 행이 추가되었습니다.');
        } catch (error) {
            console.error('폼 초기화 오류:', error);
            this.showErrorToast('초기화 중 오류가 발생했습니다.');
        }
    }

    // 입력 필드만 초기화 (기존 데이터 유지)
    clearInputFields() {
        // 회차 필드 초기화
        document.getElementById('sessionSelect').value = '';
        document.getElementById('sessionInput').value = '';
        document.getElementById('sessionSelect').style.display = 'block';
        document.getElementById('sessionInput').classList.add('hidden');
        
        // 기본 정보 필드 초기화
        document.getElementById('objective').value = '';
        document.getElementById('datetime').value = '';
        document.getElementById('location').value = '';
        document.getElementById('attendees').value = '';
        
        // 테이블 입력 필드 초기화
        this.clearTableInputs();
        
        // 현재 데이터의 입력 필드 값만 초기화 (저장된 데이터는 유지)
        this.currentData.session = '';
        this.currentData.objective = '';
        this.currentData.datetime = '';
        this.currentData.location = '';
        this.currentData.attendees = '';
    }

    // 테이블 그리드 완전 삭제 (초기화)
    clearTableInputs() {
        // 시간 계획 테이블 그리드 완전 삭제
        const timeTableBody = document.getElementById('timeTableBody');
        timeTableBody.innerHTML = '';
        
        // 참석자 테이블 그리드 완전 삭제
        const attendeeTableBody = document.getElementById('attendeeTableBody');
        attendeeTableBody.innerHTML = '';
        
        // 현재 데이터의 테이블 데이터도 초기화
        this.currentData.timeSchedule = [];
        this.currentData.attendeeList = [];
    }

    // 모바일 호환성을 위한 헬퍼 메서드들
    
    // 문자열 값 보장
    ensureStringValue(value) {
        if (value === null || value === undefined) return '';
        if (typeof value === 'string') return value.trim();
        if (typeof value === 'number') return value.toString();
        if (typeof value === 'boolean') return value.toString();
        if (Array.isArray(value)) return value.join(', ');
        if (typeof value === 'object') return JSON.stringify(value);
        return String(value);
    }
    
    
    // HTML 이스케이프 (XSS 방지 및 모바일 호환)
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 일시별 정렬
    sortByDatetime() {
        const tbody = document.getElementById('searchResultBody');
        const rows = Array.from(tbody.children);
        
        // 정렬 방향 토글
        if (!this.sortDirection) this.sortDirection = 'asc';
        else this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        
        rows.sort((a, b) => {
            const aText = a.children[1].textContent;
            const bText = b.children[1].textContent;
            
            if (aText.includes('조회된 결과가 없습니다')) return 1;
            if (bText.includes('조회된 결과가 없습니다')) return -1;
            
            const aDate = new Date(aText);
            const bDate = new Date(bText);
            
            if (this.sortDirection === 'asc') {
                return aDate - bDate;
            } else {
                return bDate - aDate;
            }
        });
        
        // 정렬된 행들을 다시 추가
        rows.forEach(row => tbody.appendChild(row));
        
        // 정렬 방향 표시 업데이트
        const header = document.querySelector('th[onclick="app.sortByDatetime()"]');
        const icon = header.querySelector('.fas.fa-sort');
        if (icon) {
            icon.className = this.sortDirection === 'asc' ? 'fas fa-sort-up text-blue-600' : 'fas fa-sort-down text-blue-600';
        }
        
        // 정렬 완료 토스트 표시
        const direction = this.sortDirection === 'asc' ? '오름차순' : '내림차순';
        this.showSuccessToast(`일시 기준 ${direction}으로 정렬되었습니다.`);
    }



    exportToPDF() {
        try {
            this.showLoading(true);
            
            // PDFMake 라이브러리 로딩 대기 및 확인
            this.waitForPDFMake().then(() => {
                console.log('✅ PDFMake 라이브러리 사용');
                this.exportToPDFWithPDFMake();
            }).catch(() => {
                console.log('🔄 PDFMake 로딩 실패, HTML to PDF 방식 사용');
                this.exportToPDFWithHTML();
            }).finally(() => {
                // 로딩 상태 해제는 각 함수에서 처리
            });
            
        } catch (error) {
            console.error('PDF 내보내기 오류:', error);
            this.showErrorToast(`PDF 내보내기 실패: ${error.message}`);
            this.showLoading(false);
        }
    }

    // PDFMake 라이브러리 로딩 대기
    waitForPDFMake() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 100; // 10초 대기 (100ms * 100)
            
            const checkPDFMake = () => {
                attempts++;
                
                if (window.pdfMake && window.pdfMake.fonts) {
                    console.log('✅ PDFMake 라이브러리 로딩 확인 완료');
                    resolve();
                } else if (attempts >= maxAttempts) {
                    console.warn('⚠️ PDFMake 로딩 시간 초과 (10초)');
                    reject(new Error('PDFMake 로딩 시간 초과'));
                } else {
                    setTimeout(checkPDFMake, 100);
                }
            };
            
            checkPDFMake();
        });
    }

    // PDFMake를 사용한 PDF 생성 (한국어 완벽 지원)
    exportToPDFWithPDFMake() {
        try {
            // PDFMake 라이브러리 로딩 확인
            if (!window.pdfMake) {
                console.warn('⚠️ PDFMake 라이브러리가 로드되지 않았습니다. HTML to PDF 방식으로 전환합니다.');
                this.exportToPDFWithHTML();
                return;
            }
            
            // PDFMake 폰트 확인
            if (!window.pdfMake.fonts) {
                console.warn('⚠️ PDFMake 폰트가 로드되지 않았습니다. HTML to PDF 방식으로 전환합니다.');
                this.exportToPDFWithHTML();
                return;
            }
            
            console.log('✅ PDFMake 라이브러리 로드 완료');
            console.log('📋 사용 가능한 폰트:', Object.keys(window.pdfMake.fonts));
            
            // 안전한 텍스트 처리 함수
            const safeText = (text) => {
                if (!text) return '';
                return String(text).replace(/[\x00-\x1F\x7F-\x9F]/g, '').trim();
            };
            
            // 일시 텍스트 그대로 사용
            const formatDateTime = (dateTime) => {
                return dateTime || '';
            };
            
            // 주요 내용 형식 변환 함수 (PDFMake용)
            const formatContentForPDF = (content) => {
                if (!content) return '';
                const text = String(content);
                
                // '- ' 문자를 기준으로 분할
                const parts = text.split('- ');
                if (parts.length <= 1) return text;
                
                let result = parts[0]; // 첫 번째 부분
                
                // 나머지 부분들을 다음 라인에 추가
                for (let i = 1; i < parts.length; i++) {
                    if (parts[i].trim()) {
                        result += '\n- ' + parts[i];
                    }
                }
                
                return result;
            };
            
            // PDF 문서 정의
            const docDefinition = {
                pageSize: 'A4',
                pageMargins: [40, 60, 40, 60],
                defaultStyle: {
                    fontSize: 10
                },
                footer: function(currentPage, pageCount) {
                    return {
                        text: `- ${currentPage} -`,
                        alignment: 'center',
                        fontSize: 10,
                        margin: [0, 10, 0, 0]
                    };
                },
                content: [
                    // 제목
                    {
                        text: safeText(this.currentData.session) || '전사 신기술 세미나 실행계획',
                        style: 'header',
                        alignment: 'center',
                        margin: [0, 0, 0, 10]
                    },
                    // 현재 일자
                    {
                        text: this.getCurrentDateString(),
                        alignment: 'right',
                        fontSize: 10,
                        margin: [0, 0, 0, 20]
                    },
                    
                    // 기본 정보
                    { text: '1. 목표', style: 'sectionHeader', margin: [0, 0, 0, 5] },
                    { text: '    □ ' + (safeText(this.currentData.objective) || '미입력'), style: 'tableCell', margin: [0, 0, 0, 10] },
                    
                    { text: '2. 일시/장소', style: 'sectionHeader', margin: [0, 0, 0, 5] },
                    { text: '    □ ' + ((formatDateTime(safeText(this.currentData.datetime)) || '미입력') + ' / ' + (safeText(this.currentData.location) || '미입력')), style: 'tableCell', margin: [0, 0, 0, 10] },
                    
                    { text: '3. 참석 대상', style: 'sectionHeader', margin: [0, 0, 0, 5] },
                    { text: '    □ ' + (safeText(this.currentData.attendees) || '미입력'), style: 'tableCell', margin: [0, 0, 0, 20] }
                ],
                styles: {
                    header: {
                        fontSize: 18,
                        bold: true
                    },
                    sectionHeader: {
                        fontSize: 14,
                        bold: true,
                        color: '#2c3e50'
                    },
                    tableHeader: {
                        fontSize: 10,
                        bold: true,
                        fillColor: '#ecf0f1'
                    },
                    tableCell: {
                        fontSize: 10
                    }
                }
            };

            // 시간 계획 테이블 추가
            if (this.currentData.timeSchedule && this.currentData.timeSchedule.length > 0) {
                const timeScheduleRows = [
                    [
                        { text: '구분', style: 'tableHeader' },
                        { text: '주요 내용', style: 'tableHeader' },
                        { text: '시간', style: 'tableHeader' },
                        { text: '담당', style: 'tableHeader' }
                    ]
                ];

                // 구분 값 병합 처리를 위한 데이터 준비
                const processedSchedule = this.processTimeScheduleForMerging(this.currentData.timeSchedule);

                processedSchedule.forEach((item, index) => {
                    const row = [
                        { text: safeText(item.type) || '', style: 'tableCell' },
                        { text: formatContentForPDF(safeText(item.content)) || '', style: 'tableCell' },
                        { text: safeText(item.time) || '', style: 'tableCell' },
                        { text: safeText(item.responsible) || '', style: 'tableCell' }
                    ];

                    // 병합이 필요한 경우 rowspan 설정
                    if (item.rowspan && item.rowspan > 1) {
                        row[0].rowSpan = item.rowspan;
                    }

                    timeScheduleRows.push(row);
                });

                docDefinition.content.push(
                    { text: '4. 시간 계획', style: 'sectionHeader', margin: [0, 20, 0, 10] },
                    {
                        table: {
                            widths: ['auto', '*', 'auto', 'auto'],
                            body: timeScheduleRows
                        },
                        margin: [0, 0, 0, 10]
                    },
                    { text: '- 이 상 –', alignment: 'right', fontSize: 10, margin: [0, 0, 0, 20] }
                );
            }

            // 참석자 명단 테이블 추가
            if (this.currentData.attendeeList && this.currentData.attendeeList.length > 0) {
                const attendeeRows = [
                    [
                        { text: 'No', style: 'tableHeader' },
                        { text: '성명', style: 'tableHeader' },
                        { text: '직급', style: 'tableHeader' },
                        { text: '소속', style: 'tableHeader' },
                        { text: '업무', style: 'tableHeader' }
                    ]
                ];

                this.currentData.attendeeList.forEach((item, index) => {
                    attendeeRows.push([
                        { text: (index + 1).toString(), style: 'tableCell' },
                        { text: safeText(item.name) || '', style: 'tableCell' },
                        { text: safeText(item.position) || '', style: 'tableCell' },
                        { text: safeText(item.department) || '', style: 'tableCell' },
                        { text: safeText(item.work) || '', style: 'tableCell' }
                    ]);
                });

                docDefinition.content.push(
                    { text: '', pageBreak: 'before' },
                    { text: '[별첨] 세미나 참석 명단', style: 'sectionHeader', margin: [0, 20, 0, 10] },
                    {
                        table: {
                            widths: ['auto', '*', '*', '*', '*'],
                            body: attendeeRows
                        }
                    }
                );
            }

            // 한국어 파일명 생성
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const fileName = `${year}${month}${day} 전사 신기술 세미나 실행계획.pdf`;

            // PDF 생성 및 다운로드
            try {
                const pdfDoc = pdfMake.createPdf(docDefinition);
                pdfDoc.download(fileName);
                this.showSuccessToast('PDF가 성공적으로 내보내졌습니다. (PDFMake 사용)');
                this.showLoading(false); // 성공 시 로딩 해제
            } catch (pdfError) {
                console.error('PDFMake PDF 생성 오류:', pdfError);
                this.showLoading(false); // 오류 시 로딩 해제
                throw new Error(`PDF 생성 실패: ${pdfError.message}`);
            }
            
        } catch (error) {
            console.error('PDFMake PDF 생성 오류:', error);
            console.log('🔄 HTML to PDF 방식으로 대체');
            this.showLoading(false); // 오류 시 로딩 해제
            this.exportToPDFWithHTML();
        }
    }

    // HTML to PDF 방식 (대체 방법)
    exportToPDFWithHTML() {
        try {
            console.log('🔄 HTML to PDF 방식으로 PDF 생성');
            
            // HTML 콘텐츠 생성
            const htmlContent = this.generatePDFHTML();
            
            // 한국어 파일명 생성
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const fileName = `${year}${month}${day} 전사 신기술 세미나 실행계획.pdf`;
            
            // Blob 생성
            const blob = new Blob([htmlContent], { type: 'text/html; charset=UTF-8' });
            const url = URL.createObjectURL(blob);
            
            // 새 창에서 HTML 열기 (about:blank 문제 해결)
            const newWindow = window.open(url, '_blank', 'width=800,height=600');
            
            // 창이 로드된 후 처리
            newWindow.onload = () => {
                // 문서 제목 설정
                newWindow.document.title = fileName.replace('.pdf', '');
                
                // 인쇄 대화상자 열기
                setTimeout(() => {
                    newWindow.print();
                    this.showSuccessToast(`PDF 인쇄 대화상자가 열렸습니다. 파일명: ${fileName}`);
                    this.showLoading(false); // 성공 시 로딩 해제
                    
                    // URL 정리
                    setTimeout(() => {
                        URL.revokeObjectURL(url);
                    }, 1000);
                }, 500);
            };
            
            // 창 로드 실패 시 처리
            newWindow.onerror = () => {
                console.error('HTML 창 로드 실패');
                this.showErrorToast('PDF 생성 창을 열 수 없습니다.');
                this.showLoading(false);
                URL.revokeObjectURL(url);
            };
            
        } catch (error) {
            console.error('HTML to PDF 오류:', error);
            this.showErrorToast(`PDF 내보내기 실패: ${error.message}`);
            this.showLoading(false); // 오류 시 로딩 해제
        }
    }

    // 대체 PDF 내보내기 방법 (HTML to PDF)
    exportToPDFAlternative() {
        try {
            console.log('🔄 대체 PDF 내보내기 방법 사용 (HTML to PDF)');
            
            // HTML 콘텐츠 생성
            const htmlContent = this.generatePDFHTML();
            
            // 새 창에서 HTML 열기
            const newWindow = window.open('', '_blank');
            newWindow.document.write(htmlContent);
            newWindow.document.close();
            
            // 인쇄 대화상자 열기
            setTimeout(() => {
                newWindow.print();
                this.showSuccessToast('PDF 인쇄 대화상자가 열렸습니다. "PDF로 저장"을 선택하세요.');
            }, 500);
            
        } catch (error) {
            console.error('대체 PDF 내보내기 오류:', error);
            this.showErrorToast(`PDF 내보내기 실패: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }

    // PDF용 HTML 콘텐츠 생성 (한국어 완벽 지원)
    generatePDFHTML() {
        const today = new Date();
        const dateString = today.toLocaleDateString('ko-KR');
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const fileName = `${year}${month}${day} 전사 신기술 세미나 실행계획`;
        
        // 안전한 텍스트 처리 함수
        const safeText = (text) => {
            if (!text) return '미입력';
            return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        };
        
        // 일시 텍스트 그대로 사용
        const formatDateTime = (dateTime) => {
            return dateTime || '';
        };
        
        // 목표 필드에서 □ 문자를 만나면 다음 라인으로 처리하는 함수 (HTML용)
        const formatObjectiveHTML = (objective) => {
            if (!objective) return '';
            const text = String(objective);
            
            // □ 문자를 기준으로 분할
            const parts = text.split('□');
            if (parts.length <= 1) return text;
            
            let result = parts[0]; // 첫 번째 부분
            
            // 나머지 부분들을 4칸 들여쓰기와 함께 추가
            for (let i = 1; i < parts.length; i++) {
                if (i == 1 && parts[i].trim()) {
                    result += '&nbsp;&nbsp;&nbsp;&nbsp;□ ' + parts[i]; // 4칸 들여쓰기
                }
                if (i !=1 && parts[i].trim()) {
                    result += '<br>&nbsp;&nbsp;&nbsp;&nbsp;□ ' + parts[i]; // 4칸 들여쓰기
                }
            }
            
            return result;
        };
        
        // 주요 내용 형식 변환 함수 (HTML용)
        const formatContentHTML = (content) => {
            if (!content) return '';
            const text = String(content);
            
            // '- ' 문자를 기준으로 분할
            const parts = text.split('- ');
            if (parts.length <= 1) return text;
            
            let result = parts[0]; // 첫 번째 부분
            
            // 나머지 부분들을 다음 라인에 추가
            for (let i = 1; i < parts.length; i++) {
                if (parts[i].trim()) {
                    result += '<br>- ' + parts[i];
                }
            }
            
            return result;
        };
        
        let html = `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>전사 신기술 세미나 실행계획</title>
    <meta name="author" content="(주)경포씨엔씨">
    <meta name="description" content="전사 신기술 세미나 실행계획서">
    <meta name="keywords" content="세미나, 실행계획, KPCNC">
    <meta name="robots" content="noindex, nofollow">
    <meta name="generator" content="">
    <style>
        @page {
            size: A4;
            margin: 2cm;
            @top-center {
                content: " ";
            }
            @bottom-center {
                content: "- " counter(page) " -";
                font-size: 10px;
                margin-top: 10px;
            }
        }
        * {
            font-family: '맑은 고딕', 'Malgun Gothic', 'Apple SD Gothic Neo', 'Noto Sans CJK KR', sans-serif !important;
        }
        body {
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            font-size: 12px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
        }
        .header h1 {
            font-size: 24px;
            font-weight: bold;
            margin: 0;
            color: #2c3e50;
        }
        .section {
            margin-bottom: 25px;
        }
        .section h2 {
            font-size: 16px;
            font-weight: bold;
            color: #34495e;
            padding-bottom: 5px;
            margin-bottom: 15px;
        }
        .info-item {
            margin: 8px 0;
            font-size: 12px;
            display: flex;
            align-items: flex-start;
        }
        .info-label {
            font-weight: bold;
            display: inline-block;
            width: 80px;
            flex-shrink: 0;
        }
        .info-content {
            margin: 5px 0 15px 0;
            word-wrap: break-word;
            overflow-wrap: break-word;
            font-size: 12px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            font-size: 11px;
        }
        th, td {
            border: 1px solid #bdc3c7;
            padding: 6px;
            text-align: left;
            vertical-align: top;
        }
        th {
            background-color: #ecf0f1;
            font-weight: bold;
        }
        .center-align {
            text-align: center;
        }
        .time-schedule-table {
            width: 100%;
        }
        .time-schedule-table th:nth-child(1),
        .time-schedule-table td:nth-child(1) {
            width: auto;
            min-width: 60px;
            max-width: 80px;
        }
        .time-schedule-table th:nth-child(2),
        .time-schedule-table td:nth-child(2) {
            width: 100%;
        }
        .time-schedule-table th:nth-child(3),
        .time-schedule-table td:nth-child(3) {
            width: auto;
            min-width: 60px;
            max-width: 80px;
        }
        .time-schedule-table th:nth-child(4),
        .time-schedule-table td:nth-child(4) {
            width: auto;
            min-width: 60px;
            max-width: 80px;
        }
        .attendee-table {
            width: 100%;
        }
        .attendee-table th,
        .attendee-table td {
            width: 20%;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            font-size: 10px;
            color: #7f8c8d;
            border-top: 1px solid #bdc3c7;
            padding-top: 10px;
        }
        @media print {
            body { 
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>${safeText(this.currentData.session)} 전사 신기술 세미나 실행계획 </h1>
        <div style="text-align: right; margin-top: 10px; font-size: 12px;">${this.getCurrentDateString()}</div>
    </div>
    
    <div class="section">
        <h2>1. 목표</h2>
        <p class="info-content">${formatObjectiveHTML(safeText(this.currentData.objective))}</p>
        
        <h2>2. 일시/장소</h2>
        <p class="info-content">&nbsp;&nbsp;&nbsp;&nbsp;□ ${formatDateTime(safeText(this.currentData.datetime))} / ${safeText(this.currentData.location)}</p>
        
        <h2>3. 참석 대상</h2>
        <p class="info-content">&nbsp;&nbsp;&nbsp;&nbsp;□ ${safeText(this.currentData.attendees)}</p>
    </div>
`;

        // 시간 계획 테이블
        if (this.currentData.timeSchedule && this.currentData.timeSchedule.length > 0) {
            html += `
    <div class="section">
        <h2>4. 시간 계획</h2>
        <table class="time-schedule-table">
            <thead>
                <tr>
                    <th class="center-align">구분</th>
                    <th>주요 내용</th>
                    <th class="center-align">시간</th>
                    <th class="center-align">담당</th>
                </tr>
            </thead>
            <tbody>
`;
            // 구분 값 병합 처리를 위한 데이터 준비
            const processedSchedule = this.processTimeScheduleForMerging(this.currentData.timeSchedule);
            
            processedSchedule.forEach((item, index) => {
                // 병합된 행인지 확인
                if (item.isMergedRow) {
                    // 병합된 행은 구분 컬럼을 제외하고 나머지만 표시
                    html += `
                <tr>
                    <td>${formatContentHTML(safeText(item.content))}</td>
                    <td class="center-align">${safeText(item.time)}</td>
                    <td class="center-align">${safeText(item.responsible)}</td>
                </tr>
`;
                } else {
                    // 일반 행 또는 병합의 첫 번째 행
                    const typeCell = item.rowspan && item.rowspan > 1 ? 
                        `<td class="center-align" rowspan="${item.rowspan}">${safeText(item.type)}</td>` :
                        `<td class="center-align">${safeText(item.type)}</td>`;
                    
                    html += `
                <tr>
                    ${typeCell}
                    <td>${formatContentHTML(safeText(item.content))}</td>
                    <td class="center-align">${safeText(item.time)}</td>
                    <td class="center-align">${safeText(item.responsible)}</td>
                </tr>
`;
                }
            });
            html += `
            </tbody>
        </table>
        <div style="text-align: right; margin-top: 10px; font-size: 12px;">– 이 상 –</div>
    </div>
`;
            }
            
            // 참석자 명단 테이블
        if (this.currentData.attendeeList && this.currentData.attendeeList.length > 0) {
            html += `
    <div class="section" style="page-break-before: always;">
        <h2>[별첨] 세미나 참석 명단</h2>
        <table class="attendee-table">
            <thead>
                <tr>
                    <th class="center-align">No</th>
                    <th class="center-align">성명</th>
                    <th class="center-align">직급</th>
                    <th class="center-align">소속</th>
                    <th class="center-align">업무</th>
                </tr>
            </thead>
            <tbody>
`;
            this.currentData.attendeeList.forEach((item, index) => {
                html += `
                <tr>
                    <td class="center-align">${index + 1}</td>
                    <td class="center-align">${safeText(item.name)}</td>
                    <td class="center-align">${safeText(item.position)}</td>
                    <td class="center-align">${safeText(item.department)}</td>
                    <td class="center-align">${safeText(item.work)}</td>
                </tr>
`;
            });
            html += `
            </tbody>
        </table>
    </div>
`;
        }

        html += `
</body>
</html>
`;

        return html;
    }

    // 시간 계획 데이터를 병합 처리하는 함수
    processTimeScheduleForMerging(timeSchedule) {
        if (!timeSchedule || timeSchedule.length === 0) return [];
        
        const processed = [];
        let currentType = null;
        let currentGroup = [];
        
        timeSchedule.forEach((item, index) => {
            const itemType = item.type || '';
            
            if (itemType === currentType && currentType !== '') {
                // 같은 구분 값이면 그룹에 추가
                currentGroup.push(item);
            } else {
                // 다른 구분 값이면 이전 그룹 처리 후 새 그룹 시작
                if (currentGroup.length > 0) {
                    this.addMergedGroupToProcessed(processed, currentGroup);
                }
                currentGroup = [item];
                currentType = itemType;
            }
        });
        
        // 마지막 그룹 처리
        if (currentGroup.length > 0) {
            this.addMergedGroupToProcessed(processed, currentGroup);
        }
        
        return processed;
    }
    
    // 병합된 그룹을 처리된 배열에 추가하는 함수
    addMergedGroupToProcessed(processed, group) {
        if (group.length === 1) {
            // 그룹에 항목이 하나면 병합하지 않음
            processed.push({ ...group[0], rowspan: 1 });
        } else {
            // 그룹에 항목이 여러 개면 첫 번째 항목에 rowspan 설정
            processed.push({ ...group[0], rowspan: group.length });
            
            // 나머지 항목들은 구분 컬럼만 빈 값으로 설정하고 나머지는 그대로 유지
            for (let i = 1; i < group.length; i++) {
                processed.push({ 
                    ...group[i], 
                    type: '', 
                    rowspan: 1,
                    isMergedRow: true  // 병합된 행임을 표시
                });
            }
        }
    }

    // 현재 일자를 반환하는 함수 (예: 2025. 7. 15(화))
    getCurrentDateString() {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const day = today.getDate();
        const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
        const weekday = weekdays[today.getDay()];
        
        return `${year}. ${month}. ${day}(${weekday})`;
    }

    // UTF-8 텍스트를 안전하게 처리하는 함수 (한국어/영어 모두 지원)
    ensureUTF8Text(text) {
        if (!text) return '';
        
        // UTF-8 인코딩을 보장하고 안전한 문자만 허용
        return String(text)
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // 제어 문자 제거
            .replace(/[\uFEFF]/g, '') // BOM 제거
            .replace(/[\u200B-\u200D\uFEFF]/g, '') // Zero-width 문자 제거
            .trim();
    }

    // 기존 함수명 유지 (호환성)
    ensureKoreanText(text) {
        return this.ensureUTF8Text(text);
    }

    // UTF-8 텍스트를 PDF에 맞게 분할하는 헬퍼 함수 (한국어/영어 모두 지원)
    splitUTF8TextToFit(text, maxWidth) {
        if (!text) return [''];
        
        const safeText = this.ensureUTF8Text(text);
        if (!safeText) return [''];
        
        // UTF-8 텍스트를 문자 단위로 처리
        const lines = [];
        let currentLine = '';
        
        for (let i = 0; i < safeText.length; i++) {
            const char = safeText[i];
            const testLine = currentLine + char;
            
            // 대략적인 문자 폭 계산 (한글은 2배 폭으로 계산)
            const charWidth = this.getCharWidth(char);
            const lineWidth = this.getLineWidth(currentLine) + charWidth;
            
            if (lineWidth <= maxWidth) {
                currentLine = testLine;
            } else {
                if (currentLine) {
                    lines.push(currentLine);
                    currentLine = char;
                } else {
                    lines.push(char);
                }
            }
        }
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines.length > 0 ? lines : [''];
    }

    // 기존 함수명 유지 (호환성)
    splitKoreanTextToFit(text, maxWidth) {
        return this.splitUTF8TextToFit(text, maxWidth);
    }

    // 문자 폭 계산 (한글은 2배 폭)
    getCharWidth(char) {
        const code = char.charCodeAt(0);
        // 한글 범위: 0xAC00-0xD7AF, 0x1100-0x11FF, 0x3130-0x318F
        if ((code >= 0xAC00 && code <= 0xD7AF) || 
            (code >= 0x1100 && code <= 0x11FF) || 
            (code >= 0x3130 && code <= 0x318F)) {
            return 2; // 한글은 2배 폭
        }
        return 1; // 영문, 숫자, 특수문자는 1배 폭
    }

    // 라인 폭 계산
    getLineWidth(line) {
        if (!line) return 0;
        return line.split('').reduce((width, char) => width + this.getCharWidth(char), 0);
    }

    // PDF용 텍스트 분할 함수 (한국어 지원)
    splitTextForPDF(text, maxWidth) {
        if (!text) return [''];
        
        const safeText = String(text);
        const lines = [];
        let currentLine = '';
        
        for (let i = 0; i < safeText.length; i++) {
            const char = safeText[i];
            const testLine = currentLine + char;
            
            // 대략적인 문자 폭 계산
            const charWidth = this.getCharWidth(char);
            const lineWidth = this.getLineWidth(currentLine) + charWidth;
            
            if (lineWidth <= maxWidth) {
                currentLine = testLine;
            } else {
                if (currentLine) {
                    lines.push(currentLine);
                    currentLine = char;
                } else {
                    lines.push(char);
                }
            }
        }
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines.length > 0 ? lines : [''];
    }

    // 기존 텍스트 분할 함수 (호환성 유지)
    splitTextToFit(text, maxWidth) {
        if (!text) return [''];
        
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        words.forEach(word => {
            const testLine = currentLine + (currentLine ? ' ' : '') + word;
            if (testLine.length * 2.5 <= maxWidth) { // 대략적인 폰트 크기 계산
                currentLine = testLine;
            } else {
                if (currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    lines.push(word);
                }
            }
        });
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines.length > 0 ? lines : [''];
    }

    // 엑셀 내보내기 (전체 데이터)
    async exportToExcel() {
        try {
            this.showLoading(true);
            
            // 전체 데이터 조회
            const result = await loadAllPlans();
            
            if (!result.success) {
                this.showErrorToast('데이터를 불러오는데 실패했습니다.');
                return;
            }
            
            const allData = result.data;
            
            if (allData.length === 0) {
                this.showErrorToast('내보낼 데이터가 없습니다.');
                return;
            }
            
            // 엑셀 워크북 생성
            const wb = XLSX.utils.book_new();
            
            // 업로드 가능한 형식으로 단일 시트 생성
            const uploadableSheet = this.createUploadableExcelSheet(allData);
            XLSX.utils.book_append_sheet(wb, uploadableSheet, '전체데이터');
            
            // 각 세미나 데이터를 개별 시트로 추가 (상세 보기용)
            allData.forEach((seminar, index) => {
                const sheetName = `세미나${index + 1}`;
                const ws = this.createExcelSheet(seminar);
                XLSX.utils.book_append_sheet(wb, ws, sheetName);
            });
            
            // 전체 요약 시트 추가
            const summarySheet = this.createSummarySheet(allData);
            XLSX.utils.book_append_sheet(wb, summarySheet, '전체요약');
            
            // 파일명 생성
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            const fileName = `${year}${month}${day}_전사신기술세미나_전체데이터.xlsx`;
            
            // 엑셀 파일 다운로드
            XLSX.writeFile(wb, fileName);
            
            this.showSuccessToast('엑셀 파일이 성공적으로 다운로드되었습니다.');
            
        } catch (error) {
            console.error('엑셀 내보내기 오류:', error);
            this.showErrorToast(`엑셀 내보내기 실패: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }
    
    // 개별 세미나 데이터를 엑셀 시트로 변환 (업로드 가능한 형식)
    createExcelSheet(seminar) {
        const data = [];
        
        // 헤더
        data.push(['전사 신기술 세미나 실행계획']);
        data.push([]);
        
        // 기본 정보
        data.push(['1. 기본 정보']);
        data.push(['회차', seminar.session || '']);
        data.push(['목표', seminar.objective || '']);
        data.push(['일시', seminar.datetime || '']);
        data.push(['장소', seminar.location || '']);
        data.push(['참석 대상', seminar.attendees || '']);
        data.push([]);
        
        // 시간 계획
        if (seminar.timeSchedule && seminar.timeSchedule.length > 0) {
            data.push(['2. 시간 계획']);
            data.push(['구분', '주요 내용', '시간', '담당']);
            
            seminar.timeSchedule.forEach(item => {
                data.push([
                    item.type || '',
                    item.content || '',
                    item.time || '',
                    item.responsible || ''
                ]);
            });
            data.push([]);
        }
        
        // 참석자 명단
        if (seminar.attendeeList && seminar.attendeeList.length > 0) {
            data.push(['3. 참석자 명단']);
            data.push(['No', '성명', '직급', '소속', '업무']);
            
            seminar.attendeeList.forEach((item, index) => {
                data.push([
                    index + 1,
                    item.name || '',
                    item.position || '',
                    item.department || '',
                    item.work || ''
                ]);
            });
        }
        
        return XLSX.utils.aoa_to_sheet(data);
    }
    
    // 업로드 가능한 형식으로 엑셀 시트 생성 (단일 시트)
    createUploadableExcelSheet(allData) {
        const data = [];
        
        // 각 세미나 데이터를 순차적으로 추가
        allData.forEach((seminar, seminarIndex) => {
            // 세미나 구분선
            if (seminarIndex > 0) {
                data.push([]);
                data.push(['='.repeat(50)]);
                data.push([]);
            }
            
            // 헤더
            data.push(['전사 신기술 세미나 실행계획']);
            data.push([]);
            
            // 기본 정보
            data.push(['1. 기본 정보']);
            data.push(['회차', seminar.session || '']);
            data.push(['목표', seminar.objective || '']);
            data.push(['일시', seminar.datetime || '']);
            data.push(['장소', seminar.location || '']);
            data.push(['참석 대상', seminar.attendees || '']);
            data.push([]);
            
            // 시간 계획
            if (seminar.timeSchedule && seminar.timeSchedule.length > 0) {
                data.push(['2. 시간 계획']);
                data.push(['구분', '주요 내용', '시간', '담당']);
                
                seminar.timeSchedule.forEach(item => {
                    data.push([
                        item.type || '',
                        item.content || '',
                        item.time || '',
                        item.responsible || ''
                    ]);
                });
                data.push([]);
            }
            
            // 참석자 명단
            if (seminar.attendeeList && seminar.attendeeList.length > 0) {
                data.push(['3. 참석자 명단']);
                data.push(['No', '성명', '직급', '소속', '업무']);
                
                seminar.attendeeList.forEach((item, index) => {
                    data.push([
                        index + 1,
                        item.name || '',
                        item.position || '',
                        item.department || '',
                        item.work || ''
                    ]);
                });
            }
        });
        
        return XLSX.utils.aoa_to_sheet(data);
    }
    
    // 전체 요약 시트 생성
    createSummarySheet(allData) {
        const data = [];
        
        // 헤더
        data.push(['전사 신기술 세미나 전체 요약']);
        data.push([]);
        
        // 요약 테이블 헤더
        data.push(['회차', '일시', '목표', '장소', '참석 대상', '시간계획 수', '참석자 수']);
        
        // 각 세미나 요약 정보
        allData.forEach(seminar => {
            data.push([
                seminar.session || '',
                seminar.datetime || '',
                seminar.objective || '',
                seminar.location || '',
                seminar.attendees || '',
                seminar.timeSchedule ? seminar.timeSchedule.length : 0,
                seminar.attendeeList ? seminar.attendeeList.length : 0
            ]);
        });
        
        return XLSX.utils.aoa_to_sheet(data);
    }

    // 파일 업로드 트리거
    triggerFileUpload() {
        const fileInput = document.getElementById('fileInput');
        fileInput.click();
    }

    // 파일 업로드 처리
    async handleFileUpload(event) {
        const file = event.target.files[0];
        
        if (!file) {
            return;
        }
        
        // 파일 확장자 검증
        const allowedExtensions = ['.xlsx', '.xls'];
        const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
        
        if (!allowedExtensions.includes(fileExtension)) {
            this.showErrorToast('엑셀 파일(.xlsx, .xls)만 업로드 가능합니다.');
            return;
        }
        
        try {
            this.showLoading(true);
            
            // 파일 읽기
            const data = await this.readExcelFile(file);
            
            if (data && Array.isArray(data)) {
                console.log('📁 엑셀 파일 읽기 성공, 데이터 길이:', data.length);
                console.log('📊 원본 데이터 (처음 10행):', data.slice(0, 10));
                
                // 먼저 단일 세미나 형식으로 파싱 시도
                const singleSeminar = this.parseExcelData(data);
                console.log('📊 단일 세미나 파싱 결과:', singleSeminar);
                console.log('📊 단일 세미나 유효성 검사 - 회차:', singleSeminar.session, '일시:', singleSeminar.datetime);
                
                // 단일 세미나가 유효한지 확인 (회차와 일시가 있는지)
                if (singleSeminar.session && singleSeminar.datetime) {
                    console.log('✅ 단일 세미나 데이터로 인식');
                    
                    // 키값 기반으로 기존 데이터 확인 및 저장/수정
                    const keyValue = `${singleSeminar.session}_${singleSeminar.datetime}`;
                    const existingData = await this.findExistingDataByKey(keyValue);
                    
                    if (existingData) {
                        // 기존 데이터가 있으면 수정
                        console.log('📝 기존 데이터 수정:', existingData.id);
                        if (useLocalStorage) {
                            this.saveToLocalStorage(singleSeminar, existingData.id);
                        } else {
                            await updateData(existingData.id, singleSeminar);
                        }
                        this.showSuccessToast('기존 세미나 데이터가 수정되었습니다.');
                    } else {
                        // 기존 데이터가 없으면 새로 등록
                        console.log('➕ 새로운 데이터 등록');
                        if (useLocalStorage) {
                            this.saveToLocalStorage(singleSeminar);
                        } else {
                            await saveData(singleSeminar);
                        }
                        this.showSuccessToast('새로운 세미나 데이터가 등록되었습니다.');
                    }
                    
                    // 폼에 데이터 로드
                    this.loadDataFromExcel(singleSeminar);
                } else {
                    // 다중 세미나 형식으로 파싱 시도
                    console.log('🔄 다중 세미나 형식으로 파싱 시도');
                    const seminars = this.parseMultipleExcelData(data);
                    console.log('📊 다중 세미나 파싱 결과:', seminars);
                    
                    if (seminars.length > 1) {
                        // 여러 세미나 데이터인 경우 일괄 저장
                        console.log('✅ 다중 세미나 데이터로 인식, 일괄 저장');
                        await this.saveMultipleSeminars(seminars);
                        this.showSuccessToast(`${seminars.length}개의 세미나 데이터가 성공적으로 업로드되었습니다.`);
                    } else if (seminars.length === 1) {
                        // 단일 세미나 데이터인 경우 키값 기반으로 저장/수정
                        console.log('✅ 다중 파싱에서 단일 세미나 발견');
                        
                        const seminar = seminars[0];
                        const keyValue = `${seminar.session}_${seminar.datetime}`;
                        const existingData = await this.findExistingDataByKey(keyValue);
                        
                        if (existingData) {
                            // 기존 데이터가 있으면 수정
                            console.log('📝 기존 데이터 수정:', existingData.id);
                            if (useLocalStorage) {
                                this.saveToLocalStorage(seminar, existingData.id);
                            } else {
                                await updateData(existingData.id, seminar);
                            }
                            this.showSuccessToast('기존 세미나 데이터가 수정되었습니다.');
                        } else {
                            // 기존 데이터가 없으면 새로 등록
                            console.log('➕ 새로운 데이터 등록');
                            if (useLocalStorage) {
                                this.saveToLocalStorage(seminar);
                            } else {
                                await saveData(seminar);
                            }
                            this.showSuccessToast('새로운 세미나 데이터가 등록되었습니다.');
                        }
                        
                        // 폼에 데이터 로드
                        this.loadDataFromExcel(seminar);
                    } else {
                        console.error('❌ 유효한 세미나 데이터를 찾을 수 없음');
                        console.error('❌ 단일 세미나 파싱 결과:', singleSeminar);
                        console.error('❌ 다중 세미나 파싱 결과:', seminars);
                        this.showErrorToast('유효한 세미나 데이터를 찾을 수 없습니다. 파일 형식을 확인해주세요.');
                    }
                }
            } else if (data && !Array.isArray(data)) {
                console.error('❌ 읽어온 데이터가 배열이 아님:', typeof data, data);
                this.showErrorToast('엑셀 파일 형식이 올바르지 않습니다.');
            } else {
                this.showErrorToast('엑셀 파일을 읽는데 실패했습니다.');
            }
            
        } catch (error) {
            console.error('파일 업로드 오류:', error);
            this.showErrorToast(`파일 업로드 실패: ${error.message}`);
        } finally {
            this.showLoading(false);
            // 파일 입력 초기화
            event.target.value = '';
        }
    }

    // 엑셀 파일 읽기
    readExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    // 첫 번째 시트의 데이터 읽기
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    
                    resolve(jsonData);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                reject(new Error('파일 읽기 실패'));
            };
            
            reader.readAsArrayBuffer(file);
        });
    }

    // 엑셀 데이터 파싱 (단일 세미나)
    parseExcelData(data) {
        console.log('📊 단일 세미나 파싱 시작, 데이터 길이:', data.length);
        const seminarData = {
            session: '',
            objective: '',
            datetime: '',
            location: '',
            attendees: '',
            timeSchedule: [],
            attendeeList: []
        };
        
        let currentSection = '';
        let timeScheduleStart = false;
        let attendeeListStart = false;
        
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length === 0) continue;
            
            const firstCell = row[0] ? String(row[0]).trim() : '';
            
            // 디버깅을 위한 로그 (처음 20행만)
            if (i < 20) {
                console.log(`단일 파싱 행 ${i}: "${firstCell}"`);
            }
            
            // 섹션 구분
            if (firstCell.includes('1. 기본 정보')) {
                currentSection = 'basic';
                console.log('📋 기본 정보 섹션 시작');
                continue;
            } else if (firstCell.includes('2. 시간 계획')) {
                currentSection = 'timeSchedule';
                timeScheduleStart = true;
                console.log('📋 시간 계획 섹션 시작');
                continue;
            } else if (firstCell.includes('3. 참석자 명단')) {
                currentSection = 'attendeeList';
                attendeeListStart = true;
                timeScheduleStart = false;
                console.log('📋 참석자 명단 섹션 시작');
                continue;
            }
            
            // 기본 정보 파싱
            if (currentSection === 'basic') {
                if (firstCell === '회차' && row[1]) {
                    seminarData.session = String(row[1]).trim();
                    console.log('📋 회차 파싱:', seminarData.session);
                } else if (firstCell === '목표' && row[1]) {
                    seminarData.objective = String(row[1]).trim();
                    console.log('📋 목표 파싱:', seminarData.objective);
                } else if (firstCell === '일시' && row[1]) {
                    seminarData.datetime = String(row[1]).trim();
                    console.log('📋 일시 파싱:', seminarData.datetime);
                } else if (firstCell === '장소' && row[1]) {
                    seminarData.location = String(row[1]).trim();
                    console.log('📋 장소 파싱:', seminarData.location);
                } else if (firstCell === '참석 대상' && row[1]) {
                    seminarData.attendees = String(row[1]).trim();
                    console.log('📋 참석 대상 파싱:', seminarData.attendees);
                }
            }
            
            // 시간 계획 파싱
            if (currentSection === 'timeSchedule' && timeScheduleStart) {
                // 헤더 행 건너뛰기
                if (firstCell === '구분') {
                    continue;
                }
                
                // 빈 행이면 시간 계획 섹션 종료
                if (!firstCell) {
                    timeScheduleStart = false;
                    continue;
                }
                
                seminarData.timeSchedule.push({
                    type: firstCell,
                    content: row[1] ? String(row[1]).trim() : '',
                    time: row[2] ? String(row[2]).trim() : '',
                    responsible: row[3] ? String(row[3]).trim() : ''
                });
            }
            
            // 참석자 명단 파싱
            if (currentSection === 'attendeeList' && attendeeListStart) {
                // 헤더 행 건너뛰기
                if (firstCell === 'No') {
                    continue;
                }
                
                // 빈 행이면 참석자 명단 섹션 종료
                if (!firstCell) {
                    attendeeListStart = false;
                    continue;
                }
                
                // No 컬럼이 있는 경우와 없는 경우 모두 처리
                let nameIndex = 1, positionIndex = 2, departmentIndex = 3, workIndex = 4;
                
                // 첫 번째 컬럼이 숫자인 경우 (No 컬럼이 있는 경우)
                if (!isNaN(parseInt(firstCell))) {
                    nameIndex = 1;
                    positionIndex = 2;
                    departmentIndex = 3;
                    workIndex = 4;
                } else {
                    // 첫 번째 컬럼이 이름인 경우 (No 컬럼이 없는 경우)
                    nameIndex = 0;
                    positionIndex = 1;
                    departmentIndex = 2;
                    workIndex = 3;
                }
                
                const attendee = {
                    name: row[nameIndex] ? String(row[nameIndex]).trim() : '',
                    position: row[positionIndex] ? String(row[positionIndex]).trim() : '',
                    department: row[departmentIndex] ? String(row[departmentIndex]).trim() : '',
                    work: row[workIndex] ? String(row[workIndex]).trim() : ''
                };
                
                console.log('👥 참석자 파싱 (단일):', attendee, '행 번호:', i);
                seminarData.attendeeList.push(attendee);
            }
        }
        
        console.log('📊 단일 세미나 파싱 완료:', seminarData);
        return seminarData;
    }
    
    // 엑셀 데이터 파싱 (여러 세미나 - 업로드용)
    parseMultipleExcelData(data) {
        console.log('📊 엑셀 데이터 파싱 시작, 총 행 수:', data.length);
        const seminars = [];
        let currentSeminar = null;
        let currentSection = '';
        let timeScheduleStart = false;
        let attendeeListStart = false;
        let isFirstSeminar = true;
        
        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            if (!row || row.length === 0) continue;
            
            const firstCell = row[0] ? String(row[0]).trim() : '';
            
            // 디버깅을 위한 로그 (처음 100행만)
            if (i < 100) {
                console.log(`행 ${i}: "${firstCell}"`);
            }
            
            // 새로운 세미나 시작 (구분선 또는 헤더)
            const isSeparator = firstCell.startsWith('=') && firstCell.length >= 20;
            const isHeader = firstCell === '전사 신기술 세미나 실행계획';
            const isLongSeparator = firstCell.includes('=') && firstCell.length >= 30; // 더 긴 구분선도 감지
            
            // 구분선 감지 로그
            if (firstCell.startsWith('=')) {
                console.log(`🔍 구분선 후보 행 ${i}: "${firstCell}" (길이: ${firstCell.length})`);
            }
            
            if (isSeparator || isHeader || isLongSeparator) {
                console.log('🆕 새로운 세미나 시작 감지:', {
                    firstCell: firstCell,
                    rowNumber: i,
                    isSeparator: isSeparator,
                    isHeader: isHeader,
                    isLongSeparator: isLongSeparator,
                    currentSeminar: currentSeminar ? currentSeminar.session : 'null'
                });
                
                if (currentSeminar && currentSeminar.session) {
                    seminars.push(currentSeminar);
                    console.log('✅ 세미나 데이터 추가:', currentSeminar.session, '총 세미나 수:', seminars.length);
                }
                
                currentSeminar = {
                    session: '',
                    objective: '',
                    datetime: '',
                    location: '',
                    attendees: '',
                    timeSchedule: [],
                    attendeeList: []
                };
                currentSection = '';
                timeScheduleStart = false;
                attendeeListStart = false;
                isFirstSeminar = false;
                continue;
            }
            
            if (!currentSeminar) continue;
            
            // 섹션 구분
            if (firstCell.includes('1. 기본 정보')) {
                currentSection = 'basic';
                continue;
            } else if (firstCell.includes('2. 시간 계획')) {
                currentSection = 'timeSchedule';
                timeScheduleStart = true;
                continue;
            } else if (firstCell.includes('3. 참석자 명단')) {
                currentSection = 'attendeeList';
                attendeeListStart = true;
                timeScheduleStart = false;
                continue;
            }
            
            // 기본 정보 파싱
            if (currentSection === 'basic') {
                if (firstCell === '회차' && row[1]) {
                    currentSeminar.session = String(row[1]).trim();
                    console.log('📋 회차 파싱:', currentSeminar.session, '행 번호:', i);
                } else if (firstCell === '목표' && row[1]) {
                    currentSeminar.objective = String(row[1]).trim();
                    console.log('📋 목표 파싱:', currentSeminar.objective, '행 번호:', i);
                } else if (firstCell === '일시' && row[1]) {
                    currentSeminar.datetime = String(row[1]).trim();
                    console.log('📋 일시 파싱:', currentSeminar.datetime, '행 번호:', i);
                } else if (firstCell === '장소' && row[1]) {
                    currentSeminar.location = String(row[1]).trim();
                    console.log('📋 장소 파싱:', currentSeminar.location, '행 번호:', i);
                } else if (firstCell === '참석 대상' && row[1]) {
                    currentSeminar.attendees = String(row[1]).trim();
                    console.log('📋 참석 대상 파싱:', currentSeminar.attendees, '행 번호:', i);
                }
            }
            
            // 시간 계획 파싱
            if (currentSection === 'timeSchedule' && timeScheduleStart) {
                if (firstCell === '구분') continue;
                if (!firstCell) {
                    timeScheduleStart = false;
                    continue;
                }
                
                currentSeminar.timeSchedule.push({
                    type: firstCell,
                    content: row[1] ? String(row[1]).trim() : '',
                    time: row[2] ? String(row[2]).trim() : '',
                    responsible: row[3] ? String(row[3]).trim() : ''
                });
            }
            
            // 참석자 명단 파싱
            if (currentSection === 'attendeeList' && attendeeListStart) {
                if (firstCell === 'No') continue;
                if (!firstCell) {
                    attendeeListStart = false;
                    continue;
                }
                
                // No 컬럼이 있는 경우와 없는 경우 모두 처리
                let nameIndex = 1, positionIndex = 2, departmentIndex = 3, workIndex = 4;
                
                // 첫 번째 컬럼이 숫자인 경우 (No 컬럼이 있는 경우)
                if (!isNaN(parseInt(firstCell))) {
                    nameIndex = 1;
                    positionIndex = 2;
                    departmentIndex = 3;
                    workIndex = 4;
                } else {
                    // 첫 번째 컬럼이 이름인 경우 (No 컬럼이 없는 경우)
                    nameIndex = 0;
                    positionIndex = 1;
                    departmentIndex = 2;
                    workIndex = 3;
                }
                
                const attendee = {
                    name: row[nameIndex] ? String(row[nameIndex]).trim() : '',
                    position: row[positionIndex] ? String(row[positionIndex]).trim() : '',
                    department: row[departmentIndex] ? String(row[departmentIndex]).trim() : '',
                    work: row[workIndex] ? String(row[workIndex]).trim() : ''
                };
                
                console.log('👥 참석자 파싱:', attendee, '행 번호:', i);
                currentSeminar.attendeeList.push(attendee);
            }
        }
        
        // 마지막 세미나 추가
        if (currentSeminar && currentSeminar.session) {
            seminars.push(currentSeminar);
            console.log('✅ 마지막 세미나 데이터 추가:', currentSeminar.session, '총 세미나 수:', seminars.length);
        } else if (currentSeminar) {
            console.log('⚠️ 마지막 세미나 데이터가 불완전함:', currentSeminar);
        }
        
        console.log('📊 파싱 완료, 총 세미나 수:', seminars.length);
        console.log('📊 파싱된 세미나 목록:', seminars.map(s => ({ session: s.session, datetime: s.datetime })));
        seminars.forEach((seminar, index) => {
            console.log(`세미나 ${index + 1}:`, seminar.session, seminar.datetime);
        });
        
        return seminars;
    }

    // 여러 세미나 데이터 일괄 저장
    async saveMultipleSeminars(seminars) {
        try {
            let successCount = 0;
            let errorCount = 0;
            
            for (const seminar of seminars) {
                try {
                    // 회차와 일시가 모두 있는지 확인
                    if (!seminar.session || !seminar.datetime) {
                        console.warn('회차 또는 일시가 없는 세미나 데이터 건너뛰기:', seminar);
                        errorCount++;
                        continue;
                    }
                    
                    // 회차 + 일시를 키값으로 사용
                    const keyValue = `${seminar.session}_${seminar.datetime}`;
                    
                    // 기존 데이터에서 동일한 키값을 가진 데이터 찾기
                    const existingData = await this.findExistingDataByKey(keyValue);
                    
                    let result;
                    
                    if (existingData) {
                        // 기존 데이터가 있으면 수정
                        if (useLocalStorage) {
                            result = this.saveToLocalStorage(seminar, existingData.id);
                        } else {
                            result = await updateData(existingData.id, seminar);
                        }
                    } else {
                        // 기존 데이터가 없으면 새로 등록
                        if (useLocalStorage) {
                            result = this.saveToLocalStorage(seminar);
                        } else {
                            result = await saveData(seminar);
                        }
                    }
                    
                    if (result.success) {
                        successCount++;
                        console.log(`세미나 데이터 저장 성공: ${seminar.session}`);
                    } else {
                        errorCount++;
                        console.error(`세미나 데이터 저장 실패: ${seminar.session}`, result.message);
                    }
                } catch (error) {
                    errorCount++;
                    console.error(`세미나 데이터 저장 오류: ${seminar.session}`, error);
                }
            }
            
            console.log(`일괄 저장 완료: 성공 ${successCount}건, 실패 ${errorCount}건`);
            
        } catch (error) {
            console.error('여러 세미나 데이터 일괄 저장 오류:', error);
            throw error;
        }
    }

    // 엑셀 데이터를 폼에 로드
    loadDataFromExcel(data) {
        // 현재 데이터 업데이트
        this.currentData = data;
        this.currentDocumentId = null; // 새 데이터이므로 ID 초기화
        
        // 폼 필드 업데이트
        this.populateForm();
    }

    // 일괄삭제 메서드 (모든 데이터 삭제)
    async bulkDeleteData() {
        try {
            // 사용자에게 일괄삭제 확인
            if (!confirm('정말로 모든 세미나 데이터를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
                return;
            }

            this.showLoading(true);

            // Firebase에서 모든 데이터 삭제
            if (useLocalStorage) {
                // 로컬 스토리지에서 모든 데이터 삭제
                localStorage.removeItem('seminarPlans');
                this.showSuccessToast('모든 데이터가 성공적으로 삭제되었습니다.');
            } else {
                // Firebase에서 모든 문서 삭제
                const snapshot = await db.collection('seminarPlans').get();
                const batch = db.batch();
                
                snapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
                
                await batch.commit();
                this.showSuccessToast(`총 ${snapshot.docs.length}개의 세미나 데이터가 성공적으로 삭제되었습니다.`);
            }
            
            // 현재 데이터 초기화
            this.currentData = {
                session: '',
                objective: '',
                datetime: '',
                location: '',
                attendees: '',
                timeSchedule: [],
                attendeeList: []
            };
            this.currentDocumentId = null;
            
            // 폼 초기화
            this.initializeMainForm();
            
        } catch (error) {
            console.error('일괄삭제 오류:', error);
            this.showErrorToast('일괄삭제 중 오류가 발생했습니다.');
        } finally {
            this.showLoading(false);
        }
    }

    // 데이터 삭제 메서드
    async deleteData() {
        try {
            // 현재 데이터가 있는지 확인
            if (!this.currentData || !this.currentData.datetime) {
                this.showErrorToast('삭제할 데이터가 없습니다.');
                return;
            }

            // 사용자에게 삭제 확인
            if (!confirm(`정말로 "${this.currentData.datetime}" 세미나 계획을 삭제하시겠습니까?`)) {
                return;
            }

            this.showLoading(true);

            // Firebase에서 데이터 삭제
            if (this.currentDocumentId) {
                const result = await deleteData(this.currentDocumentId);
                if (result.success) {
                    this.showSuccessToast('데이터가 성공적으로 삭제되었습니다.');
                    
                    // 현재 데이터 초기화
                    this.currentData = {
                        session: '',
                        objective: '',
                        datetime: '',
                        location: '',
                        attendees: '',
                        timeSchedule: [],
                        attendeeList: []
                    };
                    this.currentDocumentId = null;
                    
                    // 폼 초기화
                    this.initializeMainForm();
                } else {
                    this.showErrorToast(`데이터 삭제 실패: ${result.error}`);
                }
            } else {
                // 로컬 스토리지에서 데이터 삭제
                localStorage.removeItem('seminarData');
                this.showSuccessToast('데이터가 성공적으로 삭제되었습니다.');
                
                // 현재 데이터 초기화
                this.currentData = {
                    session: '',
                    objective: '',
                    datetime: '',
                    location: '',
                    attendees: '',
                    timeSchedule: [],
                    attendeeList: []
                };
                this.currentDocumentId = null;
                
                // 폼 초기화
                this.initializeMainForm();
            }
        } catch (error) {
            console.error('데이터 삭제 오류:', error);
            this.showErrorToast(`데이터 삭제 실패: ${error.message}`);
        } finally {
            this.showLoading(false);
        }
    }
}

// 앱 초기화
let app;
document.addEventListener('DOMContentLoaded', async function() {
    app = new SeminarPlanningApp();
    // app.initializeApp()은 constructor에서 자동으로 호출됩니다
});

// 전역 함수로 노출 (HTML에서 호출하기 위해)
window.app = app;