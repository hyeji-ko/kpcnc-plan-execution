// Firebase Configuration
// 실제 프로젝트에서는 Firebase 콘솔에서 가져온 설정을 사용해야 합니다.

const firebaseConfig = {
    apiKey: "AIzaSyDorTHDMuGf-Ghinx3-vYD-NVz_nXk-J6I",
    authDomain: "plan-execution.firebaseapp.com",
    projectId: "plan-execution",
    storageBucket: "plan-execution.firebasestorage.app",
    messagingSenderId: "319338577758",
    appId: "1:319338577758:web:560bac477f293b16b199cf"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);

// Firestore 데이터베이스 참조
const db = firebase.firestore();

// Firebase 설정 상태 확인
console.log('Firebase initialized successfully');

// Firebase를 기본 저장소로 사용
const useLocalStorage = false; // Firebase 사용

// 데이터 저장 함수 (로컬 스토리지 또는 Firebase)
async function saveData(data) {
    try {
        if (useLocalStorage) {
            // 로컬 스토리지 사용
            localStorage.setItem('seminarPlan', JSON.stringify(data));
            return { success: true, message: '로컬 스토리지에 저장되었습니다.' };
        } else {
            // Firebase 사용
            const docRef = await db.collection('seminarPlans').add({
                ...data,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true, message: 'Firebase에 저장되었습니다.', id: docRef.id };
        }
    } catch (error) {
        console.error('데이터 저장 오류:', error);
        return { success: false, message: '저장 중 오류가 발생했습니다: ' + error.message };
    }
}

// 데이터 불러오기 함수
async function loadData() {
    try {
        if (useLocalStorage) {
            // 로컬 스토리지에서 불러오기
            const data = localStorage.getItem('seminarPlan');
            if (data) {
                return { success: true, data: JSON.parse(data) };
            } else {
                return { success: false, message: '저장된 데이터가 없습니다.' };
            }
        } else {
            // Firebase에서 불러오기 (최신 문서)
            const snapshot = await db.collection('seminarPlans')
                .orderBy('createdAt', 'desc')
                .limit(1)
                .get();
            
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                return { success: true, data: doc.data(), id: doc.id };
            } else {
                return { success: false, message: '저장된 데이터가 없습니다.' };
            }
        }
    } catch (error) {
        console.error('데이터 불러오기 오류:', error);
        return { success: false, message: '데이터 불러오기 중 오류가 발생했습니다: ' + error.message };
    }
}

// 데이터 업데이트 함수
async function updateData(id, data) {
    try {
        if (useLocalStorage) {
            // 로컬 스토리지 업데이트
            localStorage.setItem('seminarPlan', JSON.stringify(data));
            return { success: true, message: '로컬 스토리지가 업데이트되었습니다.' };
        } else {
            // Firebase 업데이트
            await db.collection('seminarPlans').doc(id).update({
                ...data,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return { success: true, message: 'Firebase가 업데이트되었습니다.' };
        }
    } catch (error) {
        console.error('데이터 업데이트 오류:', error);
        return { success: false, message: '업데이트 중 오류가 발생했습니다: ' + error.message };
    }
}

// 데이터 삭제 함수
async function deleteData(id) {
    try {
        if (useLocalStorage) {
            // 로컬 스토리지 삭제
            localStorage.removeItem('seminarPlan');
            return { success: true, message: '로컬 스토리지에서 삭제되었습니다.' };
        } else {
            // Firebase 삭제
            await db.collection('seminarPlans').doc(id).delete();
            return { success: true, message: 'Firebase에서 삭제되었습니다.' };
        }
    } catch (error) {
        console.error('데이터 삭제 오류:', error);
        return { success: false, message: '삭제 중 오류가 발생했습니다: ' + error.message };
    }
}

// 모든 세미나 계획 목록 불러오기
async function loadAllPlans() {
    try {
        if (useLocalStorage) {
            // 로컬 스토리지에서는 하나의 계획만 지원
            const data = localStorage.getItem('seminarPlan');
            if (data) {
                return { success: true, data: [JSON.parse(data)] };
            } else {
                return { success: true, data: [] };
            }
        } else {
            // Firebase에서 모든 계획 불러오기
            const snapshot = await db.collection('seminarPlans')
                .orderBy('createdAt', 'desc')
                .get();
            
            const plans = [];
            snapshot.forEach(doc => {
                plans.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            return { success: true, data: plans };
        }
    } catch (error) {
        console.error('모든 계획 불러오기 오류:', error);
        return { success: false, message: '계획 목록 불러오기 중 오류가 발생했습니다: ' + error.message };
    }
}

// Firebase 설정 확인
function checkFirebaseStatus() {
    if (useLocalStorage) {
        console.log('로컬 스토리지 모드로 실행 중');
        return true;
    } else {
        try {
            const app = firebase.app();
            console.log('Firebase 앱이 정상적으로 초기화되었습니다:', app.name);
            return true;
        } catch (error) {
            console.error('Firebase 초기화 오류:', error);
            return false;
        }
    }
}

// 전역 함수로 노출 (HTML에서 호출하기 위해)
window.saveData = saveData;
window.loadData = loadData;
window.updateData = updateData;
window.deleteData = deleteData;
window.loadAllPlans = loadAllPlans;

// 페이지 로드 시 Firebase 상태 확인
document.addEventListener('DOMContentLoaded', function() {
    checkFirebaseStatus();
});
