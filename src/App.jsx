import { useState, useEffect } from 'react';
import { translations, allTests } from './data.js';
import ReactCountryFlag from 'react-country-flag';

// Импорт библиотек для PDF
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import download from 'downloadjs';

// --- КОМПОНЕНТЫ ЭКРАНОВ ---

const LanguageScreen = ({ onLanguageSelect }) => (
  <div className="screen active">
    <h1>Выберите язык / Тілді таңдаңыз / 选择语言</h1>
    <div className="language-buttons">
      <button className="btn lang-btn" onClick={() => onLanguageSelect('ru')}>
        <ReactCountryFlag countryCode="RU" svg className="flag" title="RU" />
        <span>Русский</span>
      </button>
      <button className="btn lang-btn" onClick={() => onLanguageSelect('kk')}>
        <ReactCountryFlag countryCode="KZ" svg className="flag" title="KZ" />
        <span>Қазақша</span>
      </button>
      <button className="btn lang-btn" onClick={() => onLanguageSelect('zh')}>
        <ReactCountryFlag countryCode="CN" svg className="flag" title="CN" />
        <span>中文</span>
      </button>
    </div>
  </div>
);

const NameForm = ({ onStartTest, onBack, lang }) => {
    const [formData, setFormData] = useState({ firstName: '', lastName: '', position: '' });
    const trans = translations[lang];

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      onStartTest(formData);
    };

    return (
        <form className="screen active" onSubmit={handleSubmit}>
            <div className="header-with-back">
                <button type="button" className="back-btn" onClick={onBack}>← Назад</button>
                <h1>{trans.formTitle}</h1>
            </div>
            <div className="input-group">
                <input type="text" id="firstName" placeholder={trans.firstNamePlaceholder} value={formData.firstName} onChange={handleChange} required />
                <input type="text" id="lastName" placeholder={trans.lastNamePlaceholder} value={formData.lastName} onChange={handleChange} required />
                <input type="text" id="position" placeholder={trans.positionPlaceholder} value={formData.position} onChange={handleChange} required />
            </div>
            
            <div className="form-actions">
              <a 
                href="https://drive.google.com/file/d/1KdHfZDJMKosW9FUmY_qfpG9tngHpg2Ti/view?usp=drive_link" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="btn btn-secondary"
              >
                {trans.downloadPresentationBtn}
              </a>
              <button type="submit" className="btn btn-primary">{trans.startBtn}</button>
            </div>
        </form>
    );
};

const TestScreen = ({ question, onAnswerSelect, onBack, currentNum, totalNum, lang }) => {
    const trans = translations[lang];
    const progressText = trans.progressText.replace("{current}", currentNum).replace("{total}", totalNum);
    const progressPercent = totalNum > 0 ? (currentNum / totalNum) * 100 : 0;

    return (
        <div className="screen active">
            <div className="header-with-back">
                <button className="back-btn" onClick={onBack}>← Назад</button>
                <h1>{trans.testTitle}</h1>
                <div style={{ width: '40px' }}></div>
            </div>
            {question && (
              <>
                <div id="question-container">
                    <h2 id="question-text">{question.q}</h2>
                    <div id="answers-container" className="answers">
                        {question.a.map((answer, index) => (
                            <button key={index} className="answer-btn" onClick={() => onAnswerSelect(index)}>
                                {answer}
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="progress">
                    <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
                    </div>
                    <span id="progress-text">{progressText}</span>
                </div>
              </>
            )}
        </div>
    );
};

const ResultScreen = ({ score, totalQuestions, onRestart, onDownloadPDF, lang }) => {
    const trans = translations[lang];
    const percent = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
    const scoreText = trans.scoreText
        .replace("{score}", score)
        .replace("{total}", totalQuestions)
        .replace("{percent}", percent);
    
    return (
        <div className="screen active">
            <h1>{trans.resultTitle}</h1>
            <h2 id="score-text">{scoreText}</h2>
            <div className="result-buttons">
                <button className="btn btn-primary" onClick={onDownloadPDF}>{trans.downloadBtn}</button>
                <button className="btn btn-secondary" onClick={onRestart}>{trans.restartBtn}</button>
            </div>
        </div>
    );
};

const LoadingScreen = ({ lang }) => (
    <div className="screen active">
      <h1>{translations[lang].loadingText}</h1>
      <div className="loader"></div>
    </div>
);


// --- ГЛАВНЫЙ КОМПОНЕНТ ПРИЛОЖЕНИЯ ---

function App() {
  const [screen, setScreen] = useState('language');
  const [lang, setLang] = useState('ru');
  const [userInfo, setUserInfo] = useState({ firstName: '', lastName: '', position: '' });
  const [currentTest, setCurrentTest] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);

  useEffect(() => {
    document.title = translations[lang].siteTitle;
  }, [lang]);

  const handleLanguageSelect = (selectedLang) => {
    setLang(selectedLang);
    setScreen('form');
  };

  const handleStartTest = (userData) => {
    if (!userData.firstName || !userData.lastName || !userData.position) {
      alert("Пожалуйста, заполните все поля");
      return;
    }
    setUserInfo(userData);
    setScore(0);
    setCurrentQuestionIndex(0);
    
    const testArray = allTests[lang];
    const randomIndex = Math.floor(Math.random() * testArray.length);
    setCurrentTest(testArray[randomIndex]);

    setScreen('test');
  };

  const handleAnswerSelect = (selectedIndex) => {
    if (currentTest[currentQuestionIndex] && selectedIndex === currentTest[currentQuestionIndex].c) {
      setScore(prevScore => prevScore + 1);
    }
    setTimeout(() => {
        if (currentQuestionIndex < currentTest.length - 1) {
            setCurrentQuestionIndex(prevIndex => prevIndex + 1);
        } else {
            setScreen('result');
        }
    }, 200);
  };
  
  const handleRestart = () => {
      setScreen('language');
      setUserInfo({ firstName: '', lastName: '', position: '' });
      setCurrentTest([]);
  };

  const generatePDF = async () => {
    setScreen('loading');
    try {
      const pdfUrl = '/certificate.pdf';
      const fontUrl = lang === 'zh' 
        ? '/NotoSansSC-Regular.ttf'
        : '/NotoSans-Regular.ttf';

      const pdfBytesPromise = fetch(pdfUrl).then(res => res.arrayBuffer());
      const fontBytesPromise = fetch(fontUrl).then(res => res.arrayBuffer());
      const [pdfBytes, fontBytes] = await Promise.all([pdfBytesPromise, fontBytesPromise]);

      const pdfDoc = await PDFDocument.load(pdfBytes);
      pdfDoc.registerFontkit(fontkit);
      const font = await pdfDoc.embedFont(fontBytes);
      
      const page = pdfDoc.getPages()[0];
      const trans = translations[lang];
      
      const fullName = trans.pdfFullName.replace("{lastName}", userInfo.lastName).replace("{firstName}", userInfo.firstName);
      const position = trans.pdfPosition.replace("{position}", userInfo.position);
      const scoreText = trans.pdfScore.replace("{score}", score).replace("{total}", currentTest.length);

      page.drawText(fullName, { x: 70, y: 190, size: 20, font, color: rgb(0, 0, 0) });
      page.drawText(position, { x: 70, y: 150, size: 14, font, color: rgb(0, 0, 0) });
      page.drawText(scoreText, { x: 70, y: 110, size: 16, font, color: rgb(0, 0, 0) });
      
      const newPdfBytes = await pdfDoc.save();
      download(newPdfBytes, `Certificate_${userInfo.lastName}_${userInfo.firstName}.pdf`, "application/pdf");

    } catch (error) {
      console.error("PDF generation error:", error);
      alert("Ошибка при создании PDF: " + error.message);
    } finally {
      setScreen('result');
    }
  };

  const renderCurrentScreen = () => {
    switch (screen) {
      case 'language':
        return <LanguageScreen onLanguageSelect={handleLanguageSelect} />;
      case 'form':
        return <NameForm onStartTest={handleStartTest} onBack={handleRestart} lang={lang} />;
      case 'test':
        return <TestScreen 
                  question={currentTest[currentQuestionIndex]}
                  onAnswerSelect={handleAnswerSelect}
                  onBack={handleRestart}
                  currentNum={currentQuestionIndex + 1}
                  totalNum={currentTest.length}
                  lang={lang}
               />;
      case 'result':
        return <ResultScreen 
                  score={score}
                  totalQuestions={currentTest.length}
                  onRestart={handleRestart}
                  onDownloadPDF={generatePDF}
                  lang={lang}
               />;
      case 'loading':
          return <LoadingScreen lang={lang} />;
      default:
        return <h1>Error: Unknown screen</h1>;
    }
  };
  
  return (
    <div className="container">
      {renderCurrentScreen()}
    </div>
  );
}

export default App;