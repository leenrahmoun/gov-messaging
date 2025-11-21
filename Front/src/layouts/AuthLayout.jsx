const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gov-blue via-gov-blue-dark to-gov-gray-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-2xl p-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-gov-blue mb-2">
              Gov Messaging System
            </h1>
            <p className="text-gray-600">نظام المراسلات الحكومية</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;

