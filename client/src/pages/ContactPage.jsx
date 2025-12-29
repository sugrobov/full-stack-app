import React, { useState } from 'react';
import Button from '../components/UI/Button';
import Input from '../components/UI/Input';
import Breadcrumb from '../components/Breadcrumb';
import { Link } from 'react-router-dom';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    subject: '',
    message: '',
    captcha: '',
  });
  
  const [captchaValue, setCaptchaValue] = useState(Math.floor(1000 + Math.random() * 9000));
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Reset captcha verification if user changes captcha input
    if (name === 'captcha') {
      setIsCaptchaVerified(false);
    }
  };
  
  const handleCaptchaVerify = () => {
    if (parseInt(formData.captcha) === captchaValue) {
      setIsCaptchaVerified(true);
      setSubmitError('');
    } else {
      setSubmitError('Неверный код с картинки');
    }
  };
  
  const handleCaptchaRefresh = () => {
    setCaptchaValue(Math.floor(1000 + Math.random() * 9000));
    setFormData(prev => ({ ...prev, captcha: '' }));
    setIsCaptchaVerified(false);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!isCaptchaVerified) {
      setSubmitError('Пожалуйста, подтвердите, что вы не робот');
      return;
    }
    
    // Simple spam protection - check if message is too short
    if (formData.message.length < 10) {
      setSubmitError('Сообщение слишком короткое. Пожалуйста, опишите ваш вопрос подробнее.');
      return;
    }
    
    // Simple spam protection - check if subject is too short
    if (formData.subject.length < 3) {
      setSubmitError('Тема сообщения слишком короткая.');
      return;
    }
    
    setIsSubmitting(true);
    setSubmitError('');
    
    // Simulate form submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      
      // Reset form after successful submission
      setFormData({
        subject: '',
        message: '',
        captcha: '',
      });
      setIsCaptchaVerified(false);
      setCaptchaValue(Math.floor(1000 + Math.random() * 9000));
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
    }, 1500);
  };
  
  const handleReset = () => {
    setFormData({
      subject: '',
      message: '',
      captcha: '',
    });
    setIsCaptchaVerified(false);
    setSubmitError('');
    setSubmitSuccess(false);
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Breadcrumb />
        <Link
          to="/"
          className="ml-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="mr-2 -ml-1 h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Назад
        </Link>
      </div>
      
      <h1 className="text-3xl font-bold text-gray-800 mb-8">Обратная связь</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
        {submitSuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Сообщение отправлено!</h2>
            <p className="text-gray-600 mb-6">Мы свяжемся с вами в ближайшее время.</p>
            <Button
              variant="primary"
              onClick={handleReset}
              size="lg"
            >
              Отправить еще одно сообщение
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <Input
              label="Тема письма"
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              placeholder="Введите тему сообщения"
            />
            
            
            <Input
              label="Текст сообщения"
              type="textarea"
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={6}
              placeholder="Опишите ваш вопрос или предложение"
            />
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Каптча
              </label>
              <div className="flex items-center">
                <div className="bg-gray-100 px-4 py-3 rounded-md mr-3">
                  <span className="text-2xl font-bold text-gray-800">{captchaValue}</span>
                </div>
                <Button
                  variant="ghost"
                  type="button"
                  onClick={handleCaptchaRefresh}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </Button>
              </div>
              <div className="mt-3">
                <Input
                  type="text"
                  name="captcha"
                  value={formData.captcha}
                  onChange={handleChange}
                  required
                  placeholder="Введите код с картинки"
                />
              </div>
              <div className="mt-2">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={handleCaptchaVerify}
                  disabled={!formData.captcha}
                >
                  Подтвердить
                </Button>
                {isCaptchaVerified && (
                  <span className="ml-2 text-green-600 text-sm">✓ Подтверждено</span>
                )}
              </div>
            </div>
            
            {submitError && (
              <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-md">
                {submitError}
              </div>
            )}
            
            <div className="flex flex-wrap gap-4">
              <Button
                variant="primary"
                type="submit"
                disabled={isSubmitting || !isCaptchaVerified}
              >
                {isSubmitting ? 'Отправка...' : 'Отправить'}
              </Button>
              
              <Button
                variant="secondary"
                type="button"
                onClick={handleReset}
              >
                Очистить
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ContactPage;